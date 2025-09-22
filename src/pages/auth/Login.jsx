import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import { toast } from "react-toastify";
import Logo from "../../assets/logo.png"; // make sure your logo path is correct

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Login successful");
      if (data.user.role === "admin") navigate("/admin");
      else navigate("/employee");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen "style={{
        backgroundColor: "#1f2937", // dark gray for minimal modern look
      }}>
         <img
        src={Logo}
        alt="Logo"
        className="mt-6 w-20 h-20 rounded-full shadow-lg border-2 border-white border-opacity-30 padding-2 bg-white bg-opacity-10 mb-4"
      />
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-20 backdrop-blur-md rounded-2xl shadow-xl p-10 w-96 flex flex-col"
      >
        <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-lg text-center">
          Welcome Back
        </h1>
        <p className="text-xs text-center pb-2 text-white text-opacity-40">Private EMS solution developed by Aayush Nepal.</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-6 p-3 rounded-lg border border-white border-opacity-40 bg-white bg-opacity-30 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 p-3 rounded-lg border border-white border-opacity-40 bg-white bg-opacity-30 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          required
        />

        <button
          type="submit"
          className="bg-white bg-opacity-25 hover:bg-opacity-40 text-white font-semibold py-3 rounded-lg transition shadow-md"
        >
          Login
        </button>

       
      </form>

     
    </div>
  );
}
