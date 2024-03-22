



//   const getUserData = useCallback(async () => {
//     setLoading(true);
//     const token = localStorage.getItem('jwtToken');
//     try {
//       const response = await axios.get('http://localhost:1337/api/auth/user', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
//       //console.log(response.data)
//       setUser(response.data);
//     } catch (err) {
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);