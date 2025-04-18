
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// This is the explicit API key that should be used throughout the application
export const DEFAULT_FMP_API_KEY = 'uxE1jVMvI8QQen0a4AEpLFTaqf3KQO0y';

const ApiKeyInput: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Alert>
          <AlertDescription className="flex items-center">
            <span>Die Anwendung verwendet einen Standard API-Schlüssel für den Zugriff auf Finanzdaten.</span>
            <Popover>
              <PopoverTrigger asChild>
                <Info size={16} className="ml-2 text-muted-foreground cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent>
                <p className="max-w-xs">
                  Der API-Schlüssel für Financial Modeling Prep ist: {DEFAULT_FMP_API_KEY}
                </p>
              </PopoverContent>
            </Popover>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default ApiKeyInput;
