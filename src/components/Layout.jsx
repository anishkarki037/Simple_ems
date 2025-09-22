import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-400 to-indigo-600">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-6 flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
