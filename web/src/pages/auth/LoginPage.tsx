import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button,
  InputAdornment, IconButton, CircularProgress, Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { authApi } from '@/api/endpoints/auth';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

// ── Schema ────────────────────────────────────────────────────
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password:   z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

// ── Component ─────────────────────────────────────────────────
export default function LoginPage() {
  const navigate   = useNavigate();
  const login      = useAuthStore((s) => s.login);
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setError(null);
    try {
      const result = await authApi.login(values.identifier, values.password);
      login(result.user, result.tokens.accessToken, result.tokens.refreshToken);
      toast.success(`Welcome back, ${result.user.firstName}!`);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Invalid credentials';
      setError(msg);
    }
  };

  return (
    <Box
      sx={{
        minHeight:       '100vh',
        backgroundColor: '#f5f4f0',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        p:               2,
      }}
    >
      <Box
        sx={{
          display:       'flex',
          flexDirection: 'column',
          width:         '100%',
          maxWidth:      400,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
          <Box
            sx={{
              width:           40,
              height:          40,
              borderRadius:    12,
              backgroundColor: '#01696f',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', letterSpacing: -0.5 }}>
              iA
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#1a1917', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              iAssets
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#9a9894', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              IT Asset Management
            </Typography>
          </Box>
        </Box>

        {/* Heading */}
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1917', letterSpacing: '-0.4px', mb: 0.75 }}>
          Sign in
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: '#9a9894', mb: 3.5 }}>
          Enter your credentials to access the control panel
        </Typography>

        {/* Error */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.8125rem' }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {/* Identifier */}
          <Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#3a3937', mb: 0.75 }}>
              Email or Username
            </Typography>
            <TextField
              {...register('identifier')}
              fullWidth
              placeholder="john.doe or john@company.com"
              error={!!errors.identifier}
              helperText={errors.identifier?.message}
              autoComplete="username"
              autoFocus
              sx={inputSx}
            />
          </Box>

          {/* Password */}
          <Box>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#3a3937', mb: 0.75 }}>
              Password
            </Typography>
            <TextField
              {...register('password')}
              fullWidth
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              error={!!errors.password}
              helperText={errors.password?.message}
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPass((p) => !p)}
                        edge="end"
                        size="small"
                        sx={{ color: '#9a9894' }}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={inputSx}
            />
          </Box>

          {/* Submit */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={15} color="inherit" /> : <LogIn size={16} />}
            sx={{
              mt:              0.5,
              py:              1.25,
              fontSize:        '0.875rem',
              fontWeight:      600,
              backgroundColor: '#01696f',
              borderRadius:    2,
              textTransform:   'none',
              letterSpacing:   '-0.1px',
              '&:hover': { backgroundColor: '#0c4e54' },
              '&:disabled': { backgroundColor: '#01696f80' },
            }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </Box>

        {/* Footer */}
        <Typography
          sx={{ mt: 5, textAlign: 'center', fontSize: '0.75rem', color: '#bab9b4' }}
        >
          iAssetsV3 · Control Panel · v1.0.0
        </Typography>
      </Box>
    </Box>
  );
}

// ── Shared input style ────────────────────────────────────────
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius:    2,
    backgroundColor: '#ffffff',
    fontSize:        '0.875rem',
    '& fieldset': {
      borderColor: '#e2e0db',
    },
    '&:hover fieldset': {
      borderColor: '#c8c5bf',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#01696f',
      borderWidth: '1.5px',
    },
  },
  '& .MuiFormHelperText-root': {
    fontSize:  '0.75rem',
    marginTop: '4px',
  },
};