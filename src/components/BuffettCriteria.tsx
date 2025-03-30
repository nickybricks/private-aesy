
import React from 'react';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Building2, 
  Castle, 
  LineChart, 
  Landmark, 
  Users, 
  DollarSign, 
  Clock
} from 'lucide-react';

interface CriteriaResult {
  status: 'pass' | 'warning' | 'fail';
  title: string;
  description: string;
  details: string[];
}

interface BuffettCriteriaProps {
  criteria: {
    businessModel: CriteriaResult;
    economicMoat: CriteriaResult;
    financialMetrics: CriteriaResult;
    financialStability: CriteriaResult;
    management: CriteriaResult;
    valuation: CriteriaResult;
    longTermOutlook: CriteriaResult;
  } | null;
}

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pass':
      return <Check className="text-buffett-green" />;
    case 'warning':
      return <AlertTriangle className="text-buffett-yellow" />;
    case 'fail':
      return <X className="text-buffett-red" />;
    default:
      return null;
  }
};

const CriterionIcon: React.FC<{ name: string }> = ({ name }) => {
  switch (name) {
    case 'businessModel':
      return <Building2 size={24} className="text-buffett-blue" />;
    case 'economicMoat':
      return <Castle size={24} className="text-buffett-blue" />;
    case 'financialMetrics':
      return <LineChart size={24} className="text-buffett-blue" />;
    case 'financialStability':
      return <Landmark size={24} className="text-buffett-blue" />;
    case 'management':
      return <Users size={24} className="text-buffett-blue" />;
    case 'valuation':
      return <DollarSign size={24} className="text-buffett-blue" />;
    case 'longTermOutlook':
      return <Clock size={24} className="text-buffett-blue" />;
    default:
      return null;
  }
};

const CriterionCard: React.FC<{ 
  name: string, 
  criterion: CriteriaResult,
  index: number
}> = ({ name, criterion, index }) => {
  const { status, title, description, details } = criterion;
  
  return (
    <div className="buffett-card mb-4 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <CriterionIcon name={name} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">{title}</h3>
            <StatusIcon status={status} />
          </div>
          
          <p className="text-buffett-subtext mb-4">{description}</p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Details:</h4>
            <ul className="space-y-1">
              {details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-buffett-subtext">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const BuffettCriteria: React.FC<BuffettCriteriaProps> = ({ criteria }) => {
  if (!criteria) return null;
  
  const criteriaEntries = Object.entries(criteria) as [
    keyof typeof criteria, 
    CriteriaResult
  ][];
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Buffett-Kriterien Analyse</h2>
      
      {criteriaEntries.map(([name, criterion], index) => (
        <CriterionCard 
          key={name} 
          name={name} 
          criterion={criterion} 
          index={index}
        />
      ))}
    </div>
  );
};

export default BuffettCriteria;
