import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function RoleDispatcher() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserRoleAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error || !profile) {
        setError("Could not retrieve your user profile. Please try logging in again.");
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }
      
      switch (profile.role) {
        case 'admin':
        case 'parent':
          navigate('/dashboard');
          break;
        case 'child':
          navigate('/child-dashboard');
          break;
        case 'cook':
          navigate('/cook-dashboard');
          break;
        case 'driver':
          navigate('/driver-dashboard');
          break;
        default:
          navigate('/login');
          break;
      }
      setLoading(false);
    };

    fetchUserRoleAndRedirect();
  }, [navigate]);

  if (loading || error) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-indigo-500">
            <p className="text-white text-lg">{error || 'Checking credentials...'}</p>
        </div>
    )
  }

  return null;
}