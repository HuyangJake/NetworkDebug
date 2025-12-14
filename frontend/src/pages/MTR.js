import React, { useState } from 'react';
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
  Alert,
} from '@mui/material';
import axios from 'axios';

const MTR = () => {
  const [host, setHost] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleMtr = async () => {
    if (!host.trim()) {
      setError('请输入IP地址或域名');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.post('/api/mtr', {
        host: host.trim(),
        count,
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.hint || 'MTR执行失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        MTR 网络诊断
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        网络路径追踪和诊断工具，结合了ping和traceroute的功能
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        注意：此功能需要系统安装mtr工具。macOS: brew install mtr, Linux: apt-get install mtr-tiny
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="IP地址或域名"
              placeholder="例如: 8.8.8.8 或 google.com"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              variant="outlined"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleMtr();
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>报告周期</InputLabel>
              <Select
                value={count}
                label="报告周期"
                onChange={(e) => setCount(e.target.value)}
              >
                <MenuItem value={5}>5次</MenuItem>
                <MenuItem value={10}>10次</MenuItem>
                <MenuItem value={20}>20次</MenuItem>
                <MenuItem value={50}>50次</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleMtr}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              {loading ? <CircularProgress size={24} /> : '运行MTR'}
            </Button>
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
            MTR 结果
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            目标: {results.host} | 报告周期: {results.count} | 时间: {new Date(results.timestamp).toLocaleString('zh-CN')}
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

export default MTR;

