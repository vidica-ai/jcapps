import React, { useState } from 'react';
import { LogOut, Briefcase, Grid3x3, ChevronRight, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../lib/profiles';
import ProspeccaoAtivaModern from './ProspeccaoAtivaModern';
import './Dashboard.css';

interface DashboardProps {
  onLogout: () => void;
  user: User;
  profile: Profile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, user, profile }) => {
  const [activeApp, setActiveApp] = useState<string | null>(null);

  const apps = [
    {
      id: 1,
      name: 'Prospecção Ativa',
      icon: <Briefcase size={32} />,
      description: 'Ferramentas de prospecção ativa',
      isActive: true,
      gradient: 'linear-gradient(135deg, #d4af37, #f4e4bc)',
      key: 'prospeccao-ativa'
    }
  ];

  const handleAppClick = (appKey: string) => {
    setActiveApp(appKey);
  };

  const handleBackToDashboard = () => {
    setActiveApp(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // If an app is active, show its component
  if (activeApp === 'prospeccao-ativa') {
    return <ProspeccaoAtivaModern onBack={handleBackToDashboard} />;
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Grid3x3 size={28} className="brand-icon" />
          <span className="brand-text">JC Apps</span>
        </div>
        <motion.button 
          className="logout-button"
          onClick={onLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut size={20} />
          <span>Sair</span>
        </motion.button>
      </nav>

      <div className="dashboard-content">
        <motion.div 
          className="welcome-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="welcome-text">Bem-vindo, {profile?.full_name || user.email}</h1>
          <p className="welcome-subtitle">Selecione um aplicativo para começar</p>
        </motion.div>

        <motion.div 
          className="apps-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {apps.map((app) => (
            <motion.div
              key={app.id}
              className={`app-card ${app.isActive ? 'active' : 'inactive'}`}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02,
                boxShadow: '0 20px 40px rgba(212, 175, 55, 0.2)'
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => app.isActive && handleAppClick(app.key)}
              style={{ cursor: app.isActive ? 'pointer' : 'default' }}
            >
              <div className="app-header">
                <div className="app-icon" style={{ background: app.gradient }}>
                  {app.icon}
                </div>
                <div className="app-status">
                  <Activity size={16} />
                  <span>{app.isActive ? 'Ativo' : 'Em breve'}</span>
                </div>
              </div>
              
              <h3 className="app-name">{app.name}</h3>
              <p className="app-description">{app.description}</p>
              
              <div className="app-footer">
                <div className="app-action">
                  <Zap size={16} />
                  <span>Iniciar</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              <div className="app-glow"></div>
            </motion.div>
          ))}

          {[...Array(3)].map((_, index) => (
            <motion.div
              key={`placeholder-${index}`}
              className="app-card placeholder"
              variants={itemVariants}
            >
              <div className="placeholder-content">
                <div className="placeholder-icon">
                  <Grid3x3 size={32} />
                </div>
                <p className="placeholder-text">Em Breve</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="dashboard-background">
        <div className="grid-pattern"></div>
      </div>
    </div>
  );
};

export default Dashboard;