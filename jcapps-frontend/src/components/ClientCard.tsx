import React from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  Globe, 
  MapPin, 
  Star, 
  Calendar, 
  Briefcase,
  ExternalLink
} from 'lucide-react';
import type { ProfessionalService } from '../types/professional-services';
import './ClientCard.css';

interface ClientCardProps {
  client: ProfessionalService;
  viewMode: 'grid' | 'list';
  onClick?: () => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, viewMode, onClick }) => {
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    // Remove non-digits and format as Brazilian phone number
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  const formatWhatsApp = (whatsapp: string) => {
    if (!whatsapp) return '';
    // Remove non-digits and ensure it starts with 55 for Brazil
    const digits = whatsapp.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.whatsapp) {
      const formattedNumber = formatWhatsApp(client.whatsapp);
      window.open(`https://wa.me/${formattedNumber}`, '_blank');
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.phone) {
      window.open(`tel:${client.phone}`, '_self');
    }
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.email) {
      window.open(`mailto:${client.email}`, '_self');
    }
  };

  const handleWebsite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.website) {
      const url = client.website.startsWith('http') 
        ? client.website 
        : `https://${client.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderStars = (rating: string | null) => {
    const numRating = rating ? parseFloat(rating) : 0;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          className={`star ${i <= numRating ? 'filled' : 'empty'}`}
          fill={i <= numRating ? 'currentColor' : 'none'}
        />
      );
    }
    return stars;
  };

  const getServicesArray = (services: string) => {
    return services.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { y: -4, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        className="client-card list-view"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        onClick={onClick}
      >
        <div className="client-header">
          <div className="client-info">
            <h3 className="client-name">{client.company_name}</h3>
            <p className="contact-name">{client.contact_name}</p>
          </div>
          <div className="client-rating">
            <div className="stars">{renderStars(client.rating)}</div>
            <span className="rating-text">{client.rating}</span>
          </div>
        </div>

        <div className="client-details">
          <div className="detail-item">
            <Briefcase size={16} />
            <span>{client.profession}</span>
          </div>
          <div className="detail-item">
            <MapPin size={16} />
            <span>{client.city}, {client.state}</span>
          </div>
          <div className="detail-item">
            <Calendar size={16} />
            <span>{client.years_experience} anos</span>
          </div>
        </div>

        <div className="client-actions">
          {client.whatsapp && (
            <motion.button
              className="action-btn whatsapp"
              onClick={handleWhatsApp}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="WhatsApp"
            >
              <MessageCircle size={18} />
            </motion.button>
          )}
          {client.phone && (
            <motion.button
              className="action-btn call"
              onClick={handleCall}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Ligar"
            >
              <Phone size={18} />
            </motion.button>
          )}
          {client.email && (
            <motion.button
              className="action-btn email"
              onClick={handleEmail}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Email"
            >
              <Mail size={18} />
            </motion.button>
          )}
          {client.website && (
            <motion.button
              className="action-btn website"
              onClick={handleWebsite}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Website"
            >
              <Globe size={18} />
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="client-card grid-view"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={onClick}
    >
      <div className="card-header">
        <div className="client-avatar">
          <span className="avatar-text">
            {client.company_name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <div className="client-rating">
          <div className="stars">{renderStars(client.rating)}</div>
          <span className="rating-text">{client.rating}</span>
        </div>
      </div>

      <div className="card-content">
        <h3 className="client-name">{client.company_name}</h3>
        <p className="contact-name">{client.contact_name}</p>
        
        <div className="client-meta">
          <div className="meta-item">
            <Briefcase size={14} />
            <span className="profession">{client.profession}</span>
          </div>
          {client.specialization && (
            <div className="meta-item">
              <span className="specialization">{client.specialization}</span>
            </div>
          )}
          <div className="meta-item">
            <MapPin size={14} />
            <span className="location">{client.city}, {client.state}</span>
          </div>
          <div className="meta-item">
            <Calendar size={14} />
            <span className="experience">{client.years_experience} anos</span>
          </div>
        </div>

        {client.services && (
          <div className="services-tags">
            {getServicesArray(client.services).slice(0, 3).map((service, index) => (
              <span key={index} className="service-tag">
                {service}
              </span>
            ))}
            {getServicesArray(client.services).length > 3 && (
              <span className="service-tag more">
                +{getServicesArray(client.services).length - 3}
              </span>
            )}
          </div>
        )}

        {client.notes && (
          <p className="client-notes">{client.notes.slice(0, 100)}{client.notes.length > 100 ? '...' : ''}</p>
        )}
      </div>

      <div className="card-actions">
        {client.whatsapp && (
          <motion.button
            className="action-btn whatsapp"
            onClick={handleWhatsApp}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="WhatsApp"
          >
            <MessageCircle size={18} />
            <span>WhatsApp</span>
          </motion.button>
        )}
        {client.phone && (
          <motion.button
            className="action-btn call"
            onClick={handleCall}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Ligar"
          >
            <Phone size={18} />
          </motion.button>
        )}
        {client.email && (
          <motion.button
            className="action-btn email"
            onClick={handleEmail}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Email"
          >
            <Mail size={18} />
          </motion.button>
        )}
        {client.website && (
          <motion.button
            className="action-btn website"
            onClick={handleWebsite}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Website"
          >
            <ExternalLink size={16} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default ClientCard;