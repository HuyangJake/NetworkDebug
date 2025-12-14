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
  IconButton,
  Alert,
  Link,
} from '@mui/material';
import {
  Scanner as ScannerIcon,
  Dns as DnsIcon,
  NetworkPing as PingIcon,
  Route as MtrIcon,
  Http as HttpIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [ipAddresses, setIpAddresses] = useState({ ipv4: [], ipv6: [] });
  const [loading, setLoading] = useState(true);
  const [ipv4RetryCount, setIpv4RetryCount] = useState(0);
  const [ipv6RetryCount, setIpv6RetryCount] = useState(0);
  const MAX_RETRY_COUNT = 3; // 最多重试3次后显示提示

  useEffect(() => {
    fetchIpAddresses();
  }, []);

  const fetchIpAddresses = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setLoading(true);
    }
    
    try {
      const response = await axios.get('/api/ip-addresses');
      const hasIpv4 = response.data.ipv4 && response.data.ipv4.length > 0;
      const hasIpv6 = response.data.ipv6 && response.data.ipv6.length > 0;
      
      setIpAddresses(response.data);
      
      // 分别跟踪IPv4和IPv6的失败次数
      if (hasIpv4) {
        setIpv4RetryCount(0); // 获取成功，重置计数
      } else {
        setIpv4RetryCount(prev => prev + 1); // 获取失败，增加计数
      }
      
      if (hasIpv6) {
        setIpv6RetryCount(0); // 获取成功，重置计数
      } else {
        setIpv6RetryCount(prev => prev + 1); // 获取失败，增加计数
      }
    } catch (error) {
      console.error('获取IP地址失败:', error);
      // 请求失败时，两个都算失败
      setIpv4RetryCount(prev => prev + 1);
      setIpv6RetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchIpAddresses(true);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          当前设备公网IP地址
        </Typography>
        <IconButton
          onClick={handleRefresh}
          disabled={loading}
          color="primary"
          aria-label="刷新IP地址"
          sx={{ ml: 2 }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                公网 IPv4 地址
              </Typography>
            </Box>
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
              <Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  未检测到公网IPv4地址
                </Typography>
                {ipv4RetryCount >= MAX_RETRY_COUNT && !loading && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      多次尝试后仍无法获取公网IPv4地址。您可以访问{' '}
                      <Link 
                        href="https://www.bj-ipv6.com/z/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        underline="always"
                      >
                        北京市IPv6发展平台
                      </Link>
                      {' '}自行确认您的公网IP地址。
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                公网 IPv6 地址
              </Typography>
            </Box>
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
              <Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  未检测到公网IPv6地址
                </Typography>
                {ipv6RetryCount >= MAX_RETRY_COUNT && !loading && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      多次尝试后仍无法获取公网IPv6地址。您可以访问{' '}
                      <Link 
                        href="https://www.bj-ipv6.com/z/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        underline="always"
                      >
                        北京市IPv6发展平台
                      </Link>
                      {' '}自行确认您的公网IP地址。
                    </Typography>
                  </Alert>
                )}
              </Box>
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

