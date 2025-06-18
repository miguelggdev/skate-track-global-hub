
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    
    if (userRole) {
      // Si ya está logueado, redirigir al dashboard correspondiente
      switch (userRole) {
        case 'administrador':
          navigate('/admin-dashboard');
          break;
        case 'entrenador':
          navigate('/coach-dashboard');
          break;
        case 'deportista':
          navigate('/athlete-dashboard');
          break;
        case 'delegado':
          navigate('/delegate-dashboard');
          break;
        case 'gestor_financiero':
          navigate('/finance-dashboard');
          break;
        case 'lider':
          navigate('/leader-dashboard');
          break;
        default:
          navigate('/login');
      }
    } else {
      // Si no está logueado, ir al login
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">SpeedSkate Academy</h1>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
};

export default Index;
