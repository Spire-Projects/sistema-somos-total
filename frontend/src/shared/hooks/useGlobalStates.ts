import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { Currency, CreateCurrencyData, UpdateCurrencyData } from '../types/modelTypes/Currency';
import {
  fetchCurrency,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  setCurrency as setCurrencyAction,
  clearError as clearCurrencyError,
} from '../store/currencySlice';
import { loadAndValidateUser, logout } from '../store/authSlice';

/**
 * Custom hook para centralizar accesos a estados globales usados frecuentemente
 * Provee helpers para manejar el `Currency` (single) y acciones básicas de auth.
 */
export const useGlobalStates = () => {
  const dispatch = useAppDispatch();

  // Currency selectors
  const currency = useAppSelector((s) => s.currency.currency) as Currency | null;
  const currencyLoading = useAppSelector((s) => s.currency.loading);
  const currencyError = useAppSelector((s) => s.currency.error);

  // Auth selectors (útiles en muchas pantallas)
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const authLoading = useAppSelector((s) => s.auth.isValidating);

  // Currency actions
  const fetchCurrencyById = useCallback((id: string) => dispatch(fetchCurrency(id)), [dispatch]);
  const createNewCurrency = useCallback((data: CreateCurrencyData) => dispatch(createCurrency(data)), [dispatch]);
  const updateExistingCurrency = useCallback(
    (id: string, data: UpdateCurrencyData) => dispatch(updateCurrency({ id, data })),
    [dispatch]
  );
  const deleteExistingCurrency = useCallback((id: string) => dispatch(deleteCurrency(id)), [dispatch]);
  const setCurrency = useCallback((c: Currency | null) => dispatch(setCurrencyAction(c)), [dispatch]);
  const clearCurrencyErr = useCallback(() => dispatch(clearCurrencyError()), [dispatch]);

  // Auth actions
  const loadUser = useCallback(() => dispatch(loadAndValidateUser()), [dispatch]);
  const doLogout = useCallback(() => dispatch(logout()), [dispatch]);

  return useMemo(
    () => ({
      // currency state
      currency,
      currencyLoading,
      currencyError,
      // currency actions
      fetchCurrencyById,
      createNewCurrency,
      updateExistingCurrency,
      deleteExistingCurrency,
      setCurrency,
      clearCurrencyErr,
      // auth state
      user,
      isAuthenticated,
      authLoading,
      // auth actions
      loadUser,
      doLogout,
    }),
    [
      currency,
      currencyLoading,
      currencyError,
      fetchCurrencyById,
      createNewCurrency,
      updateExistingCurrency,
      deleteExistingCurrency,
      setCurrency,
      clearCurrencyErr,
      user,
      isAuthenticated,
      authLoading,
      loadUser,
      doLogout,
    ]
  );
};

export default useGlobalStates;