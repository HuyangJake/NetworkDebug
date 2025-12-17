import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider as ListDivider,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import axios from 'axios';

const STORAGE_KEY = 'pingHistory';
const MAX_HISTORY = 20;

const Ping = () => {
  const [host, setHost] = useState('');
  const [count, setCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

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

  const handlePing = async () => {
    if (!host.trim()) {
      setError('请输入IP地址或域名');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const trimmedHost = host.trim();
      const response = await axios.post('/api/ping', {
        host: trimmedHost,
        count,
      });
      setResults(response.data);
      // Ping成功后添加到历史记录
      addToHistory(trimmedHost);
    } catch (err) {
      setError(err.response?.data?.error || 'Ping失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Ping 测试
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        测试网络连通性和延迟，支持IPv4和IPv6地址
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="IP地址或域名"
                placeholder="例如: 8.8.8.8 或 google.com 或 2001:4860:4860::8888"
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
                  setTimeout(() => setShowHistory(false), 200);
                }}
                variant="outlined"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePing();
                  }
                }}
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
                        {index < history.length - 1 && <ListDivider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>次数</InputLabel>
              <Select
                value={count}
                label="次数"
                onChange={(e) => setCount(e.target.value)}
              >
                <MenuItem value={1}>1次</MenuItem>
                <MenuItem value={4}>4次</MenuItem>
                <MenuItem value={10}>10次</MenuItem>
                <MenuItem value={20}>20次</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handlePing}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Ping'}
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
            Ping 结果
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            目标: {results.host} | 次数: {results.count} | 时间: {new Date(results.timestamp).toLocaleString('zh-CN')}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box
            component="pre"
            sx={{
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {results.output}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Ping;

