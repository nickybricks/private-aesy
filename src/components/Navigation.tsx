
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, LineChart, Calculator } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const Navigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <NavigationMenu className="mb-6">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    className={`flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md ${
                      isActive('/') 
                      ? 'bg-gradient-to-b from-buffett-blue to-buffett-blue/90 text-white' 
                      : 'bg-gradient-to-b from-buffett-blue/50 to-buffett-blue p-6'
                    }`}
                    to="/"
                  >
                    <LineChart className="h-6 w-6 text-white" />
                    <div className="mb-2 mt-4 text-lg font-medium text-white">
                      Aesy
                    </div>
                    <p className="text-sm leading-tight text-white/90">
                      Analysieren Sie Aktien nach bewährten Investmentprinzipien
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors ${
                      isActive('/quant-analyzer')
                      ? 'bg-buffett-blue/10 text-buffett-blue' 
                      : 'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                    }`}
                    to="/quant-analyzer"
                  >
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-buffett-blue" />
                      <div className="text-sm font-medium leading-none">Boersen Analyzer</div>
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Erweiterte quantitative Analyse für Value-Investoren
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <div 
                  className="block select-none space-y-1 rounded-md p-3 leading-none transition-colors text-muted-foreground/70"
                >
                  <div className="flex items-center">
                    <Calculator className="h-4 w-4 mr-2 text-muted-foreground/70" />
                    <div className="text-sm font-medium leading-none">Portfolio Tracker</div>
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug">
                    Portfolio-Tracking nach bewährten Prinzipien (Coming Soon)
                  </p>
                </div>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default Navigation;
