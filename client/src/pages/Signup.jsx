import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Signup({ onLogin }) { // Reuse onLogin to auto-login after signup if desired, or just redirect
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        fullName: '',
        university: '',
        studyProgram: '',
        yearOnStudyProgram: ''
    })
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (response.ok) {
                // Auto login or redirect to login. Let's redirect to login for now to keep it simple, 
                // or effectively "mock" login if we want. 
                // But better UX is often just redirect to login with a success message, OR auto-login.
                // I will implement "Redirect to Login" for clarity.
                alert('Registration successful! Please login.')
                navigate('/login')
            } else {
                setError(data.error || 'Registration failed')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        }
    }

    return (
        <div className="container auth-container">
            <div className="auth-card">
                <h2>Sign Up</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input name="fullName" placeholder="John Doe" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input name="username" placeholder="johndoe" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" name="email" placeholder="john@example.com" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" name="password" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="university">University</label>
                        <input name="university" placeholder="Tech University" onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="studyProgram">Study Program</label>
                        <input name="studyProgram" placeholder="Computer Science" onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="yearOnStudyProgram">Year of Study</label>
                        <input type="number" name="yearOnStudyProgram" placeholder="3" onChange={handleChange} />
                    </div>
                    <button type="submit" className="submit-btn">Sign Up</button>
                </form>
            </div>
        </div>
    )
}

export default Signup
