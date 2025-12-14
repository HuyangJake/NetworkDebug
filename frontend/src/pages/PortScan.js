import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Alert,
  Collapse,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import axios from 'axios';

const STORAGE_KEY = 'portScanHistory';
const MAX_HISTORY = 20; // 最多保存20条历史记录

const COMMON_PORTS = [
  { name: 'HTTP', port: 80 },
  { name: 'HTTPS', port: 443 },
  { name: 'SSH', port: 22 },
  { name: 'FTP', port: 21 },
  { name: 'Telnet', port: 23 },
  { name: 'SMTP', port: 25 },
  { name: 'DNS', port: 53 },
  { name: 'DHCP', port: 67 },
  { name: 'TFTP', port: 69 },
  { name: 'HTTP-Alt', port: 8080 },
  { name: 'MySQL', port: 3306 },
  { name: 'PostgreSQL', port: 5432 },
  { name: 'Redis', port: 6379 },
  { name: 'MongoDB', port: 27017 },
  { name: 'RDP', port: 3389 },
];

const PortScan = () => {
  const [host, setHost] = useState('');
  const [customPorts, setCustomPorts] = useState('');
  const [selectedCommonPorts, setSelectedCommonPorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showStatusHelp, setShowStatusHelp] = useState(false);

  // 从localStorage加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('加载历史记录失败:', e);
      }
    }
  }, []);

  // 保存历史记录到localStorage
  const saveHistory = (newHistory) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  // 添加历史记录
  const addToHistory = (address) => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) return;

    const newHistory = [
      trimmedAddress,
      ...history.filter((item) => item !== trimmedAddress),
    ].slice(0, MAX_HISTORY);

    saveHistory(newHistory);
  };

  // 删除单个历史记录
  const deleteHistoryItem = (address) => {
    const newHistory = history.filter((item) => item !== address);
    saveHistory(newHistory);
  };

  // 清空所有历史记录
  const clearAllHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      saveHistory([]);
    }
  };

  // 使用历史记录填充输入框
  const handleHistoryItem = (address) => {
    setHost(address);
    setShowHistory(false);
  };

  const handleScan = async () => {
    if (!host.trim()) {
      setError('请输入IP地址或域名');
      return;
    }

    let portsToScan = [...selectedCommonPorts];

    // 解析自定义端口
    if (customPorts.trim()) {
      const customPortList = customPorts
        .split(',')
        .map((p) => parseInt(p.trim()))
        .filter((p) => !isNaN(p) && p > 0 && p <= 65535);
      portsToScan = [...portsToScan, ...customPortList];
    }

    if (portsToScan.length === 0) {
      setError('请至少选择一个常用端口或输入自定义端口');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const trimmedHost = host.trim();
      const response = await axios.post('/api/port-scan', {
        host: trimmedHost,
        ports: portsToScan,
      });
      setResults(response.data);
      // 扫描成功后添加到历史记录
      addToHistory(trimmedHost);
    } catch (err) {
      setError(err.response?.data?.error || '扫描失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleCommonPort = (port) => {
    setSelectedCommonPorts((prev) =>
      prev.includes(port)
        ? prev.filter((p) => p !== port)
        : [...prev, port]
    );
  };

  const openPorts = results?.results?.filter((r) => r.status === 'open') || [];
  const closedPorts = results?.results?.filter((r) => r.status === 'closed') || [];
  const filteredPorts = results?.results?.filter((r) => r.status === 'filtered') || [];
  const respondedPorts = results?.results?.filter((r) => r.response === 'responded') || [];
  const noResponsePorts = results?.results?.filter((r) => r.response === 'no_response') || [];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        端口扫描
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        支持IPv4和IPv6地址，扫描指定端口的开放情况
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="IP地址或域名"
                placeholder="例如: 192.168.1.1 或 example.com 或 2001:db8::1"
                value={host}
                onChange={(e) => {
                  setHost(e.target.value);
                  setShowHistory(e.target.value === '' && history.length > 0);
                }}
                onFocus={() => {
                  if (history.length > 0) {
                    setShowHistory(true);
                  }
                }}
                onBlur={() => {
                  // 延迟隐藏，以便点击历史记录项
                  setTimeout(() => setShowHistory(false), 200);
                }}
                variant="outlined"
                InputProps={{
                  endAdornment: history.length > 0 && (
                    <Tooltip title="历史记录">
                      <IconButton
                        onClick={() => setShowHistory(!showHistory)}
                        edge="end"
                        size="small"
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />
              {showHistory && history.length > 0 && (
                <Paper
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    mt: 0.5,
                    maxHeight: 300,
                    overflow: 'auto',
                    boxShadow: 3,
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      px: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle2">历史记录</Typography>
                    <Tooltip title="清空所有">
                      <IconButton
                        size="small"
                        onClick={clearAllHistory}
                        color="error"
                      >
                        <ClearAllIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <List dense>
                    {history.map((item, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          button
                          onClick={() => handleHistoryItem(item)}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemText primary={item} />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHistoryItem(item);
                              }}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < history.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              常用端口
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {COMMON_PORTS.map((portInfo) => (
                <Chip
                  key={portInfo.port}
                  label={`${portInfo.name} (${portInfo.port})`}
                  onClick={() => toggleCommonPort(portInfo.port)}
                  color={selectedCommonPorts.includes(portInfo.port) ? 'primary' : 'default'}
                  variant={selectedCommonPorts.includes(portInfo.port) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="自定义端口（逗号分隔）"
              placeholder="例如: 8080,9000,3000"
              value={customPorts}
              onChange={(e) => setCustomPorts(e.target.value)}
              variant="outlined"
              helperText="输入端口号，多个端口用逗号分隔，范围: 1-65535"
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              onClick={handleScan}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : '开始扫描'}
            </Button>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Typography color="error">{error}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            扫描结果
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            目标: {results.host} | 时间: {new Date(results.timestamp).toLocaleString('zh-CN')}
          </Typography>

          {results.ipAddresses && results.ipAddresses.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                IP地址:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {results.ipAddresses.map((ip, index) => (
                  <Chip
                    key={index}
                    label={`${ip.address} (${ip.family})`}
                    color={ip.family === 'IPv6' ? 'secondary' : 'primary'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                label={`开放端口: ${openPorts.length}`}
                color="success"
              />
              <Chip
                label={`关闭端口: ${closedPorts.length}`}
                color="default"
              />
              <Chip
                label={`过滤端口: ${filteredPorts.length}`}
                color="warning"
              />
              <Chip
                label={`有响应: ${respondedPorts.length}`}
                color="info"
              />
              <Chip
                label={`无响应: ${noResponsePorts.length}`}
                color="error"
              />
            </Box>
            <Alert 
              severity="info" 
              icon={<InfoIcon />}
              sx={{ mb: 2 }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setShowStatusHelp(!showStatusHelp)}
                >
                  {showStatusHelp ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              }
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  状态说明
                </Typography>
              </Box>
            </Alert>
            <Collapse in={showStatusHelp}>
              <Box sx={{ mb: 2, pl: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>开放 + 有响应：</strong>端口有服务在运行，可以正常连接
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>关闭 + 有响应：</strong>端口没有服务，但主机明确拒绝了连接（说明主机可达，端口存在）
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>过滤 + 无响应：</strong>连接超时，可能被防火墙过滤或端口不存在
                </Typography>
              </Box>
            </Collapse>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>端口</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>响应情况</TableCell>
                  <TableCell>响应时间</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.results.map((result, index) => {
                  const getStatusLabel = (status) => {
                    switch (status) {
                      case 'open':
                        return '开放';
                      case 'closed':
                        return '关闭';
                      case 'filtered':
                        return '过滤';
                      default:
                        return status;
                    }
                  };

                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'open':
                        return 'success';
                      case 'closed':
                        return 'default';
                      case 'filtered':
                        return 'warning';
                      default:
                        return 'default';
                    }
                  };

                  const getResponseLabel = (response) => {
                    switch (response) {
                      case 'responded':
                        return '有响应';
                      case 'no_response':
                        return '无响应';
                      default:
                        return response || '未知';
                    }
                  };

                  const getResponseColor = (response) => {
                    switch (response) {
                      case 'responded':
                        return 'info';
                      case 'no_response':
                        return 'error';
                      default:
                        return 'default';
                    }
                  };

                  return (
                    <TableRow key={index}>
                      <TableCell>{result.port}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(result.status)}
                          color={getStatusColor(result.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getResponseLabel(result.response)}
                          color={getResponseColor(result.response)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{result.duration}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default PortScan;

