import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, TextField, Button, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    if (!form.name || !form.email || !form.password) return 'All fields are required';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.08) 0%, transparent 50%)',
      p: 2,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Card sx={{ maxWidth: 440, width: '100%', p: 4, borderRadius: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 2,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 24, color: '#fff',
              boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
            }}>
              A
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Create Account</Typography>
            <Typography variant="body2" color="text.secondary">Join the ACME Team Management System</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              id="register-name" fullWidth label="Full Name" value={form.name}
              onChange={handleChange('name')} sx={{ mb: 2 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Person sx={{ color: '#64748b' }} /></InputAdornment> } }}
            />
            <TextField
              id="register-email" fullWidth label="Email" type="email" value={form.email}
              onChange={handleChange('email')} sx={{ mb: 2 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email sx={{ color: '#64748b' }} /></InputAdornment> } }}
            />
            <TextField
              id="register-password" fullWidth label="Password"
              type={showPassword ? 'text' : 'password'} value={form.password}
              onChange={handleChange('password')} sx={{ mb: 2 }}
              helperText="Minimum 8 characters"
              slotProps={{ input: {
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#64748b' }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              } }}
            />
            <TextField
              id="register-role" fullWidth select label="Role" value={form.role}
              onChange={handleChange('role')} sx={{ mb: 3 }}
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="contributor">Contributor</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            <Button
              id="register-submit" fullWidth type="submit" variant="contained" size="large"
              disabled={loading} sx={{ mb: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </form>

          <Typography variant="body2" align="center" color="text.secondary">
            Already have an account?{' '}
            <Typography component={RouterLink} to="/login" variant="body2"
              sx={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
              Sign In
            </Typography>
          </Typography>
        </Card>
      </motion.div>
    </Box>
  );
}
