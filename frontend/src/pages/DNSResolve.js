import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import axios from 'axios';

const STORAGE_KEY = 'dnsResolveHistory';
const MAX_HISTORY = 20;

const DNSResolve = () => {
  const [hostname, setHostname] = useState('');
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
  const addToHistory = (host) => {
    const trimmedHost = host.trim();
    if (!trimmedHost) return;

    const newHistory = [
      trimmedHost,
      ...history.filter((item) => item !== trimmedHost),
    ].slice(0, MAX_HISTORY);

    saveHistory(newHistory);
  };

  // 删除单个历史记录
  const deleteHistoryItem = (host) => {
    const newHistory = history.filter((item) => item !== host);
    saveHistory(newHistory);
  };

  // 清空所有历史记录
  const clearAllHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      saveHistory([]);
    }
  };

  // 使用历史记录填充输入框
  const handleHistoryItem = (host) => {
    setHostname(host);
    setShowHistory(false);
  };

  const handleResolve = async () => {
    if (!hostname.trim()) {
      setError('请输入域名或主机名');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const trimmedHostname = hostname.trim();
      const response = await axios.post('/api/dns-resolve', {
        hostname: trimmedHostname,
      });
      setResults(response.data);
      // 解析成功后添加到历史记录
      addToHistory(trimmedHostname);
    } catch (err) {
      setError(err.response?.data?.error || 'DNS解析失败');
    } finally {
      setLoading(false);
    }
  };

  const renderRecordSection = (title, records, type) => {
    if (!records || records.length === 0) {
      return (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{title}</Typography>
            <Chip label="无记录" color="default" size="small" sx={{ ml: 2 }} />
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary">未找到{title}记录</Typography>
          </AccordionDetails>
        </Accordion>
      );
    }

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>{title}</Typography>
          <Chip
            label={`${records.length}条记录`}
            color="primary"
            size="small"
            sx={{ ml: 2 }}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {records.map((record, index) => (
              <Box key={index}>
                {type === 'MX' ? (
                  <Typography>
                    优先级: {record.priority} | 邮件服务器: {record.exchange}
                  </Typography>
                ) : type === 'TXT' ? (
                  <Typography sx={{ wordBreak: 'break-all' }}>
                    {record}
                  </Typography>
                ) : type === 'ALL' ? (
                  <Typography>
                    {record.address} ({record.family === 4 ? 'IPv4' : 'IPv6'})
                  </Typography>
                ) : (
                  <Typography>{record}</Typography>
                )}
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        DNS解析
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        解析域名的DNS记录，包括A、AAAA、CNAME、MX、NS、TXT等记录类型
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={10}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="域名或主机名"
                placeholder="例如: example.com 或 www.google.com"
                value={hostname}
                onChange={(e) => {
                  setHostname(e.target.value);
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
                    handleResolve();
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
                        {index < history.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleResolve}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} /> : '解析'}
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
            解析结果
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            域名: {results.hostname} | 时间: {new Date(results.timestamp).toLocaleString('zh-CN')}
          </Typography>

          <Box sx={{ mt: 2 }}>
            {renderRecordSection('A记录 (IPv4)', results.records.A, 'A')}
            {renderRecordSection('AAAA记录 (IPv6)', results.records.AAAA, 'AAAA')}
            {renderRecordSection('CNAME记录', results.records.CNAME, 'CNAME')}
            {renderRecordSection('MX记录 (邮件交换)', results.records.MX, 'MX')}
            {renderRecordSection('NS记录 (名称服务器)', results.records.NS, 'NS')}
            {renderRecordSection('TXT记录', results.records.TXT, 'TXT')}
            {renderRecordSection('所有地址', results.records.ALL, 'ALL')}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default DNSResolve;

