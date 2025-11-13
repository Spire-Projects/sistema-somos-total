import { useAppSelector } from "../store/hooks";
import { ChevronDown, Menu } from "lucide-react";
import { useOptimizedNavigation } from "../hooks/useOptimizedNavigation";
import { memo, useEffect, useState } from "react";
import useGlobalStates from "../hooks/useGlobalStates";
import { currencyService } from "../services/CurrencyService";
import CurrencyEditModal from './CurrencyEditModal';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = memo(({ onToggleSidebar }: HeaderProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const { currentSectionName } = useOptimizedNavigation();
  const { currency , setCurrency} = useGlobalStates();
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  useEffect(() => {
      const listenCurrency = () => {
        currencyService.listen$(1, 1, "ARG").subscribe((data) => {
          if (data.length > 0) {
            const activeCurrency = data[0];
            setCurrency(activeCurrency);
          }
        });
      };

      listenCurrency();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 shadow-sm">
      <div className="flex justify-between items-center">
        {user && (
          <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {/* Botón menú para móviles */}
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="p-2 -ml-1 sm:-ml-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
                  aria-label="Menú"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}

              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate flex-1 min-w-0">
                {currentSectionName}
              </h2>
            </div>

            {/* Right side - Notifications and User Info */}
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
              {currency && (
                <>
                  <div
                    onClick={() => setIsCurrencyModalOpen(true)}
                    className="hidden md:flex flex-col items-center border px-5 rounded-2xl hover:bg-green-50 hover:border-green-200 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setIsCurrencyModalOpen(true); }}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      Moneda: {currency.simbol}
                    </span>
                    <span className="text-xs text-gray-500">
                      1 {currency.simbol} = {currency.equivalenceToBs} Bs
                    </span>
                  </div>

                  <CurrencyEditModal
                    isOpen={isCurrencyModalOpen}
                    onOpenChange={setIsCurrencyModalOpen}
                    currency={currency}
                    onSaved={(updated) => setCurrency(updated)}
                  />
                </>
              )}

              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
                {/* Desktop/Tablet: Mostrar nombre completo */}
                <div className="hidden sm:block text-sm text-right">
                  <div className="font-medium text-gray-900 text-xs sm:text-sm">
                    {user.fullName}
                  </div>
                  <div className="text-gray-500 capitalize text-xs">
                    {user.role}
                  </div>
                </div>

                {/* Mobile: Solo mostrar inicial y chevron */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-medium text-white">
                      {user.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
});
