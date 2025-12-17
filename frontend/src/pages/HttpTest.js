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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListItemSecondaryAction,
  Divider as ListDivider,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import axios from 'axios';

const STORAGE_KEY = 'httpTestHistory';
const MAX_HISTORY = 20;

const HttpTest = () => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [timeout, setTimeout] = useState(10000);
  const [followRedirects, setFollowRedirects] = useState(true);
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
  const addToHistory = (urlValue) => {
    const trimmedUrl = urlValue.trim();
    if (!trimmedUrl) return;

    const newHistory = [
      trimmedUrl,
      ...history.filter((item) => item !== trimmedUrl),
    ].slice(0, MAX_HISTORY);

    saveHistory(newHistory);
  };

  // 删除单个历史记录
  const deleteHistoryItem = (urlValue) => {
    const newHistory = history.filter((item) => item !== urlValue);
    saveHistory(newHistory);
  };

  // 清空所有历史记录
  const clearAllHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      saveHistory([]);
    }
  };

  // 使用历史记录填充输入框
  const handleHistoryItem = (urlValue) => {
    setUrl(urlValue);
    setShowHistory(false);
  };

  const handleTest = async () => {
    if (!url.trim()) {
      setError('请输入URL');
      return;
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch (e) {
      setError('URL格式不正确，请包含协议（http://或https://）');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const trimmedUrl = url.trim();
      const response = await axios.post('/api/http-test', {
        url: trimmedUrl,
        method,
        timeout,
        followRedirects,
      });
      setResults(response.data);
      // 测试成功后添加到历史记录
      addToHistory(trimmedUrl);
    } catch (err) {
      setError(err.response?.data?.error || 'HTTP测试失败');
      setResults({
        success: false,
        error: err.response?.data?.error || 'HTTP测试失败',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        HTTP/HTTPS 连接测试
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        测试HTTP/HTTPS协议层面的连接，检查服务是否可访问
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="URL"
                placeholder="例如: https://example.com 或 http://192.168.1.1:8080"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
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
                    handleTest();
                  }
                }}
                helperText="必须包含协议（http://或https://）"
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
              <InputLabel>请求方法</InputLabel>
              <Select
                value={method}
                label="请求方法"
                onChange={(e) => setMethod(e.target.value)}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="HEAD">HEAD</MenuItem>
                <MenuItem value="OPTIONS">OPTIONS</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleTest}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} /> : '测试'}
            </Button>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>超时时间（毫秒）</InputLabel>
              <Select
                value={timeout}
                label="超时时间（毫秒）"
                onChange={(e) => setTimeout(e.target.value)}
              >
                <MenuItem value={5000}>5秒</MenuItem>
                <MenuItem value={10000}>10秒</MenuItem>
                <MenuItem value={30000}>30秒</MenuItem>
                <MenuItem value={60000}>60秒</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>跟随重定向</InputLabel>
              <Select
                value={followRedirects ? 'yes' : 'no'}
                label="跟随重定向"
                onChange={(e) => setFollowRedirects(e.target.value === 'yes')}
              >
                <MenuItem value="yes">是</MenuItem>
                <MenuItem value="no">否</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
        </Grid>
      </Paper>

      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            测试结果
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Chip
              label={results.success ? '连接成功' : '连接失败'}
              color={results.success ? 'success' : 'error'}
              sx={{ mr: 1, mb: 1 }}
            />
            {results.statusCode && (
              <Chip
                label={`状态码: ${results.statusCode}`}
                color={
                  results.statusCode >= 200 && results.statusCode < 300
                    ? 'success'
                    : results.statusCode >= 300 && results.statusCode < 400
                    ? 'warning'
                    : 'error'
                }
                sx={{ mr: 1, mb: 1 }}
              />
            )}
            {results.responseTime && (
              <Chip
                label={`响应时间: ${results.responseTime}`}
                color="info"
                sx={{ mr: 1, mb: 1 }}
              />
            )}
            {results.redirectCount > 0 && (
              <Chip
                label={`重定向: ${results.redirectCount}次`}
                color="warning"
                sx={{ mr: 1, mb: 1 }}
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                请求信息
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>URL</strong></TableCell>
                      <TableCell>{results.url}</TableCell>
                    </TableRow>
                    {results.finalUrl && results.finalUrl !== results.url && (
                      <TableRow>
                        <TableCell><strong>最终URL</strong></TableCell>
                        <TableCell>{results.finalUrl}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell><strong>方法</strong></TableCell>
                      <TableCell>{method}</TableCell>
                    </TableRow>
                    {results.statusCode && (
                      <TableRow>
                        <TableCell><strong>状态码</strong></TableCell>
                        <TableCell>
                          {results.statusCode} {results.statusMessage}
                        </TableCell>
                      </TableRow>
                    )}
                    {results.responseTime && (
                      <TableRow>
                        <TableCell><strong>响应时间</strong></TableCell>
                        <TableCell>{results.responseTime}</TableCell>
                      </TableRow>
                    )}
                    {results.error && (
                      <TableRow>
                        <TableCell><strong>错误</strong></TableCell>
                        <TableCell>
                          <Alert severity="error" sx={{ py: 0 }}>
                            {results.error}
                            {results.errorCode && ` (${results.errorCode})`}
                          </Alert>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {results.headers && Object.keys(results.headers).length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  响应头
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Header</strong></TableCell>
                        <TableCell><strong>Value</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(results.headers).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell>{key}</TableCell>
                          <TableCell sx={{ wordBreak: 'break-word' }}>
                            {Array.isArray(value) ? value.join(', ') : value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>

          {results.diagnosis && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                自动诊断结果
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                连接失败时自动执行的诊断分析
              </Alert>

              <Grid container spacing={2}>
                {/* DNS诊断 */}
                {results.diagnosis.dns && (
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {results.diagnosis.dns.success ? (
                          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                        ) : (
                          <ErrorIcon color="error" sx={{ mr: 1 }} />
                        )}
                        <Typography variant="subtitle1">DNS解析</Typography>
                      </Box>
                      {results.diagnosis.dns.success ? (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            解析成功，找到以下IP地址：
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {results.diagnosis.dns.addresses.map((addr, idx) => (
                              <Chip
                                key={idx}
                                label={`${addr.address} (${addr.family})`}
                                size="small"
                                color={addr.family === 'IPv6' ? 'secondary' : 'primary'}
                              />
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {results.diagnosis.dns.error}
                        </Alert>
                      )}
                    </Paper>
                  </Grid>
                )}

                {/* Ping诊断 */}
                {results.diagnosis.ping && (
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {results.diagnosis.ping.success ? (
                          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                        ) : (
                          <ErrorIcon color="error" sx={{ mr: 1 }} />
                        )}
                        <Typography variant="subtitle1">网络连通性</Typography>
                      </Box>
                      {results.diagnosis.ping.success ? (
                        <Typography variant="body2" color="text.secondary">
                          Ping测试成功，主机可达
                        </Typography>
                      ) : (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {results.diagnosis.ping.error || 'Ping测试失败'}
                        </Alert>
                      )}
                    </Paper>
                  </Grid>
                )}

                {/* 端口扫描诊断 */}
                {results.diagnosis.portScan && (
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {results.diagnosis.portScan.status === 'open' ? (
                          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                        ) : (
                          <WarningIcon color="warning" sx={{ mr: 1 }} />
                        )}
                        <Typography variant="subtitle1">端口扫描</Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={`端口 ${results.diagnosis.portScan.port}`}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        <Chip
                          label={results.diagnosis.portScan.status === 'open' ? '开放' : 
                                 results.diagnosis.portScan.status === 'closed' ? '关闭' : '过滤'}
                          color={results.diagnosis.portScan.status === 'open' ? 'success' : 'warning'}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        <Chip
                          label={results.diagnosis.portScan.response === 'responded' ? '有响应' : '无响应'}
                          color={results.diagnosis.portScan.response === 'responded' ? 'info' : 'error'}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                        {results.diagnosis.portScan.duration && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            响应时间: {results.diagnosis.portScan.duration}
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {/* 分析和建议 */}
              {(results.diagnosis.analysis && results.diagnosis.analysis.length > 0) ||
               (results.diagnosis.recommendations && results.diagnosis.recommendations.length > 0) ? (
                <Box sx={{ mt: 3 }}>
                  {results.diagnosis.analysis && results.diagnosis.analysis.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">问题分析</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {results.diagnosis.analysis.map((item, idx) => (
                            <ListItem key={idx}>
                              <ListItemText
                                primary={item}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {results.diagnosis.recommendations && results.diagnosis.recommendations.length > 0 && (
                    <Accordion sx={{ mt: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">建议措施</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {results.diagnosis.recommendations.map((item, idx) => (
                            <ListItem key={idx}>
                              <ListItemText
                                primary={item}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              ) : null}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default HttpTest;

