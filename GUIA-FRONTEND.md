# 📱 GUIA DE IMPLEMENTAÇÃO - FRONTEND (React)

## 🔐 Autenticação JWT - Integração com Backend

### 📋 Índice
1. [Setup Inicial](#setup-inicial)
2. [Serviço de Autenticação](#serviço-de-autenticação)
3. [Componente Login](#componente-login)
4. [Componente PrivateRoute](#componente-privateroute)
5. [Context de Autenticação](#context-de-autenticação)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [Tratamento de Erros](#tratamento-de-erros)

---

## Setup Inicial

### 1. Instalar Dependências

```bash
npm install axios react-router-dom
```

### 2. Criar Estrutura de Pastas

```
src/
├── services/
│   └── authService.js
├── context/
│   └── AuthContext.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   └── AdminUsers.jsx
├── components/
│   └── PrivateRoute.jsx
└── App.jsx
```

---

## Serviço de Autenticação

### `src/services/authService.js`

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar respostas com erro 401 (token expirado/inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  /**
   * Fazer login
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {Promise} { success, token, expires_in, user }
   */
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });
      
      if (response.data.success) {
        // Salvar token e dados do usuário no localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('expiresIn', response.data.expires_in);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao fazer login' };
    }
  },

  /**
   * Fazer logout
   * @returns {Promise}
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Sempre limpar o token, mesmo se houver erro
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresIn');
    }
  },

  /**
   * Obter usuário autenticado
   * @returns {object|null}
   */
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Verificar se usuário está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Obter token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('token');
  },

  // ========== ROTAS ADMIN ==========

  /**
   * Listar todos os usuários (apenas superadmin)
   * @returns {Promise}
   */
  async listUsers() {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao listar usuários' };
    }
  },

  /**
   * Criar novo usuário (apenas superadmin)
   * @param {string} username
   * @param {string} password
   * @param {string} role - 'user' ou 'superadmin'
   * @returns {Promise}
   */
  async createUser(username, password, role = 'user') {
    try {
      const response = await api.post('/admin/users', {
        username,
        password,
        role
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao criar usuário' };
    }
  },

  /**
   * Atualizar usuário (apenas superadmin)
   * @param {number} id
   * @param {object} updates - { role?, active? }
   * @returns {Promise}
   */
  async updateUser(id, updates) {
    try {
      const response = await api.put(`/admin/users/${id}`, updates);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao atualizar usuário' };
    }
  },

  /**
   * Deletar usuário (apenas superadmin)
   * @param {number} id
   * @returns {Promise}
   */
  async deleteUser(id) {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao deletar usuário' };
    }
  },

  // ========== ROTAS REGISTROS ==========

  /**
   * Listar registros com filtros
   * @param {object} filters - { data?, usuario?, etc }
   * @returns {Promise}
   */
  async listarRegistros(filters = {}) {
    try {
      const response = await api.get('/registros', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao listar registros' };
    }
  },

  /**
   * Obter indicadores
   * @returns {Promise}
   */
  async obterIndicadores() {
    try {
      const response = await api.get('/registros/indicadores');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao obter indicadores' };
    }
  },

  /**
   * Obter estatísticas
   * @returns {Promise}
   */
  async obterEstatisticas() {
    try {
      const response = await api.get('/registros/estatisticas');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao obter estatísticas' };
    }
  },

  /**
   * Upload de arquivo Excel
   * @param {File} file
   * @returns {Promise}
   */
  async uploadRegistros(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/registros/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao fazer upload' };
    }
  },

  /**
   * Deletar registros
   * @param {object} filters
   * @returns {Promise}
   */
  async deletarRegistros(filters = {}) {
    try {
      const response = await api.delete('/registros', { data: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao deletar registros' };
    }
  }
};

export default authService;
```

---

## Context de Autenticação

### `src/context/AuthContext.jsx`

```javascript
import { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar usuário do localStorage ao montar o componente
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(username, password);
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.error || 'Erro ao fazer login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err.error || 'Erro ao fazer logout');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para usar o contexto
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
```

---

## Componente Login

### `src/pages/Login.jsx`

```javascript
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css'; // Veja estilos abaixo

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validação básica
      if (!username.trim()) {
        setError('Nome de usuário é obrigatório');
        setLoading(false);
        return;
      }
      if (!password) {
        setError('Senha é obrigatória');
        setLoading(false);
        return;
      }

      // Fazer login
      await login(username, password);
      
      // Redirecionar para dashboard após sucesso
      navigate('/dashboard');
    } catch (err) {
      setError(err.error || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🍽️ Sistema Catracas</h1>
          <p>Autenticação Segura</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`login-button ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p>Credenciais padrão (superadmin):</p>
          <p><strong>Usuário:</strong> superadmin</p>
          <p><strong>Senha:</strong> Tl&g@:2025</p>
        </div>
      </div>
    </div>
  );
}
```

### Estilos Login - `src/styles/Login.css`

```css
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
}

.login-header p {
  margin: 10px 0 0 0;
  color: #999;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.login-button {
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.1s;
}

.login-button:hover:not(:disabled) {
  background-color: #5568d3;
  transform: translateY(-2px);
}

.login-button:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.login-button.loading::after {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-left: 8px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 12px;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 5px;
  color: #c33;
  font-size: 14px;
}

.login-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #999;
  text-align: center;
}

.login-footer p {
  margin: 5px 0;
}

.login-footer strong {
  color: #333;
}

/* Responsivo */
@media (max-width: 600px) {
  .login-card {
    margin: 20px;
    padding: 30px 20px;
  }

  .login-header h1 {
    font-size: 24px;
  }
}
```

---

## Componente PrivateRoute

### `src/components/PrivateRoute.jsx`

```javascript
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function PrivateRoute({ children, requiredRole = null }) {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar role se necessário
  if (requiredRole && user.role !== requiredRole && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
```

---

## App.jsx - Configuração de Rotas

```javascript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminUsers from './pages/AdminUsers';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Rota apenas para superadmin */}
          <Route
            path="/admin/users"
            element={
              <PrivateRoute requiredRole="superadmin">
                <AdminUsers />
              </PrivateRoute>
            }
          />

          {/* Redirecionar raiz para dashboard ou login */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Página não encontrada */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

---

## Exemplos de Uso

### Usar Auth em um Componente

```javascript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav>
      <h2>Bem-vindo, {user?.username}!</h2>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}
```

### Usar authService Diretamente

```javascript
import authService from '../services/authService';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await authService.listUsers();
      setUsers(response.users);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando usuários...</div>;

  return (
    <div>
      <h1>Usuários do Sistema</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuário</th>
            <th>Role</th>
            <th>Ativo</th>
            <th>Último Login</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>{u.active ? 'Sim' : 'Não'}</td>
              <td>{new Date(u.last_login).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Tratamento de Erros

### Tipos de Erro Comuns

```javascript
// 1. Credenciais inválidas
// Status: 401
// Resposta: { error: "Credenciais inválidas" }

// 2. Token expirado/inválido
// Status: 401
// Resposta: { error: "Token inválido ou expirado" }
// Ação: Redirecionar para login

// 3. Sem permissão
// Status: 403
// Resposta: { error: "Acesso negado" }

// 4. Sem token
// Status: 401
// Resposta: { error: "Token não enviado" }

// 5. Erro de servidor
// Status: 500
// Resposta: { error: "Erro ao processar requisição" }
```

### Interceptor de Erro Global

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error;

    switch (status) {
      case 401:
        // Token inválido/expirado
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        break;
      case 403:
        // Sem permissão
        console.error('Acesso negado:', message);
        break;
      case 404:
        // Recurso não encontrado
        console.error('Não encontrado:', message);
        break;
      case 500:
        // Erro de servidor
        console.error('Erro de servidor:', message);
        break;
      default:
        console.error('Erro:', message || error.message);
    }

    return Promise.reject(error);
  }
);
```

---

## Environment Variables

### `.env.local`

```env
REACT_APP_API_URL=http://localhost:3000/api
# Ou para produção:
# REACT_APP_API_URL=https://catraca.visualsoftia.cloud/api
```

---

## Fluxo de Autenticação Resumido

```
1. Usuário acessa /login
   ↓
2. Preenche username e password
   ↓
3. Clica em "Entrar"
   ↓
4. authService.login(username, password)
   ↓
5. Backend valida credenciais
   ↓
6. Backend retorna { token, expires_in, user }
   ↓
7. Frontend salva token em localStorage
   ↓
8. Redireciona para /dashboard
   ↓
9. Componentes autenticados usam token em Authorization header
   ↓
10. Token expira ou usuário faz logout
    ↓
11. Token é removido do localStorage
    ↓
12. Interceptor detecta 401 e redireciona para /login
```


---

## 💰 Módulo Financeiro

### Endpoint: Fluxo Diário
Retorna os dados de Receitas e Despesas para um período específico.

- **URL:** `/api/financeiro/fluxo-diario`
- **Method:** `GET`
- **Auth:** Required (Token JWT)
- **Query Params:**
  - `data_inicial` (YYYY-MM-DD)
  - `data_final` (YYYY-MM-DD)

### Exemplo de Resposta

```json
[
  {
    "data": "2024-01-19",
    "tipo": "RECEITA",
    "cod_sub_custo": "1",
    "descricao": "Valor Mercadoria",
    "valor": 1500.00
  },
  {
    "data": "2024-01-19",
    "tipo": "DESPESA",
    "cod_sub_custo": "101",
    "descricao": "Combustível | Posto X",
    "valor": -200.00
  }
]
```

### Serviço Frontend (`src/services/financeiroService.js`)

```javascript
import api from './api'; // Sua instância do Axios

const financeiroService = {
  /**
   * Obtém o fluxo diário (receitas e despesas)
   * @param {string} dataInicial - YYYY-MM-DD
   * @param {string} dataFinal - YYYY-MM-DD
   * @returns {Promise<Array>}
   */
  async getFluxoDiario(dataInicial, dataFinal) {
    try {
      const response = await api.get('/financeiro/fluxo-diario', {
        params: {
          data_inicial: dataInicial,
          data_final: dataFinal
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar fluxo diário:', error);
      throw error;
    }
  }
};

export default financeiroService;
```

---

## ✅ Checklist de Implementação

- [ ] Instalar axios e react-router-dom
- [ ] Criar `src/services/authService.js`
- [ ] Criar `src/context/AuthContext.jsx`
- [ ] Criar `src/pages/Login.jsx` com estilos
- [ ] Criar `src/components/PrivateRoute.jsx`
- [ ] Configurar rotas em `App.jsx`
- [ ] Adicionar `AuthProvider` em `main.jsx`
- [ ] Testar login com credenciais padrão
- [ ] Testar acesso a rota protegida
- [ ] Testar logout
- [ ] Testar redirecionamento após logout
- [ ] Testar erro de credenciais inválidas
- [ ] Implementar componentes de admin (se necessário)
- [ ] Adicionar mensagens de erro amigáveis

---

## 🆘 Troubleshooting

### Erro: "Cannot find module 'uuid'"
Solução: Use `crypto.randomUUID()` em vez de `uuid`

### Erro: "Token não fornecido"
Causa: Token não está sendo enviado no header Authorization
Solução: Verificar se `localStorage.getItem('token')` retorna um valor

### Erro: "CORS erro"
Causa: Frontend e backend em domínios diferentes
Solução: Verificar CORS configurado no backend com os domínios corretos

### Redireciona para login infinitamente
Causa: Token sempre inválido
Solução: Verificar se JWT_SECRET é igual em backend e frontend (não precisa, mas token deve ser válido)

---

## 📚 Documentação Útil

- [React Router v6](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
- [JSON Web Tokens](https://jwt.io/)
- [React Context API](https://react.dev/learn/passing-data-deeply-with-context)
