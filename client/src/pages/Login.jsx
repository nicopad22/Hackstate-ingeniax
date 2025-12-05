import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })

            const data = await response.json()

            if (response.ok) {
                onLogin(data.user)
                navigate('/')
            } else {
                setError(data.error || 'Inicio de sesión fallido')
            }
        } catch (err) {
            setError('Ocurrió un error. Inténtalo de nuevo.')
        }
    }

    return (
        <div className="container auth-container">
            <div className="auth-card">
                <h2>Iniciar Sesión</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Usuario</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">Iniciar Sesión</button>
                </form>
            </div>
        </div>
    )
}

export default Login
