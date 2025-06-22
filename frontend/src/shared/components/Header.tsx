import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/authSlice";
import logo from "../../assets/logo.png";

export const Header = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-blue-600 text-white px-6 py-4 shadow-md">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img src={logo} alt="FarmaApp Logo" className="h-8 w-8 rounded" />
          <h1 className="text-xl font-bold">FarmaApp</h1>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{user.fullName}</span>
              <span className="ml-2 px-2 py-1 bg-blue-500 rounded-full text-xs capitalize">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
