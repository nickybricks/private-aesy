
import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, LineChart } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const Navigation = () => {
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
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-buffett-blue/50 to-buffett-blue p-6 no-underline outline-none focus:shadow-md"
                    to="/"
                  >
                    <LineChart className="h-6 w-6 text-white" />
                    <div className="mb-2 mt-4 text-lg font-medium text-white">
                      Buffett Benchmark Tool
                    </div>
                    <p className="text-sm leading-tight text-white/90">
                      Analysieren Sie Aktien nach Warren Buffetts Investmentprinzipien
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    to="/quant-analyzer"
                  >
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-buffett-blue" />
                      <div className="text-sm font-medium leading-none">Quant Analyzer</div>
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Erweiterte quantitative Analyse für Value-Investoren
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default Navigation;
