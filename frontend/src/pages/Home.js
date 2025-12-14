import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import {
  Scanner as ScannerIcon,
  Dns as DnsIcon,
  NetworkPing as PingIcon,
  Route as MtrIcon,
  Http as HttpIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [ipAddresses, setIpAddresses] = useState({ ipv4: [], ipv6: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIpAddresses();
  }, []);

  const fetchIpAddresses = async () => {
    try {
      const response = await axios.get('/api/ip-addresses');
      setIpAddresses(response.data);
    } catch (error) {
      console.error('获取IP地址失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const tools = [
    {
      title: '端口扫描',
      description: '扫描指定IP的端口开放情况，支持IPv4和IPv6',
      icon: <ScannerIcon sx={{ fontSize: 40 }} />,
      path: '/port-scan',
      color: '#1976d2',
    },
    {
      title: 'DNS解析',
      description: '解析域名的DNS记录，包括A、AAAA、MX、NS等',
      icon: <DnsIcon sx={{ fontSize: 40 }} />,
      path: '/dns-resolve',
      color: '#2e7d32',
    },
    {
      title: 'Ping',
      description: '测试网络连通性和延迟',
      icon: <PingIcon sx={{ fontSize: 40 }} />,
      path: '/ping',
      color: '#ed6c02',
    },
    {
      title: 'MTR',
      description: '网络路径追踪和诊断',
      icon: <MtrIcon sx={{ fontSize: 40 }} />,
      path: '/mtr',
      color: '#9c27b0',
    },
    {
      title: 'HTTP测试',
      description: '测试HTTP/HTTPS协议连接，检查服务可访问性',
      icon: <HttpIcon sx={{ fontSize: 40 }} />,
      path: '/http-test',
      color: '#d32f2f',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        网络调试工具
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        当前设备公网IP地址
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              公网 IPv4 地址
            </Typography>
            {loading ? (
              <Typography>正在获取...</Typography>
            ) : ipAddresses.ipv4.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={ipAddresses.ipv4[0].address}
                  color="primary"
                  sx={{ fontSize: '1rem', py: 2, px: 1 }}
                />
              </Box>
            ) : (
              <Typography color="text.secondary">未检测到公网IPv4地址</Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              公网 IPv6 地址
            </Typography>
            {loading ? (
              <Typography>正在获取...</Typography>
            ) : ipAddresses.ipv6.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={ipAddresses.ipv6[0].address}
                  color="secondary"
                  sx={{ fontSize: '1rem', py: 2, px: 1 }}
                />
              </Box>
            ) : (
              <Typography color="text.secondary">未检测到公网IPv6地址</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        功能工具
      </Typography>
      <Grid container spacing={3}>
        {tools.map((tool) => (
          <Grid item xs={12} sm={6} md={3} key={tool.path}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => navigate(tool.path)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: tool.color, mb: 2 }}>{tool.icon}</Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {tool.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tool.description}
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(tool.path);
                  }}
                >
                  使用工具
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Home;

