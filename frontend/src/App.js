import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './pages/Home';
import PortScan from './pages/PortScan';
import DNSResolve from './pages/DNSResolve';
import Ping from './pages/Ping';
import MTR from './pages/MTR';
import HttpTest from './pages/HttpTest';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/port-scan" element={<PortScan />} />
            <Route path="/dns-resolve" element={<DNSResolve />} />
            <Route path="/ping" element={<Ping />} />
            <Route path="/mtr" element={<MTR />} />
            <Route path="/http-test" element={<HttpTest />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;

