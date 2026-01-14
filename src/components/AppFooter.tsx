import React from 'react';
import { useTranslation } from '@/context/LanguageContext';

const AppFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 pt-8 border-t border-gray-200 text-buffett-subtext text-sm text-center">
      <p className="mb-2">
        {t('footer.tagline')}
      </p>
      <p className="mb-2">
        {t('footer.realTimeAnalysis')}
      </p>
      <p>
        {t('footer.disclaimer')}
      </p>
    </footer>
  );
};

export default AppFooter;
