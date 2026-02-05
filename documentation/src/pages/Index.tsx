 import { useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 
 const Index = () => {
   const navigate = useNavigate();
 
   useEffect(() => {
     navigate("/docs", { replace: true });
   }, [navigate]);
 
   return null;
 };
 
 export default Index;
