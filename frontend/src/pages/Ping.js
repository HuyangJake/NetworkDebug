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
} from '@mui/material';
import axios from 'axios';

const Ping = () => {
  const [host, setHost] = useState('');
  const [count, setCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handlePing = async () => {
    if (!host.trim()) {
      setError('请输入IP地址或域名');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.post('/api/ping', {
        host: host.trim(),
        count,
      });
      setResults(response.data);
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
            <TextField
              fullWidth
              label="IP地址或域名"
              placeholder="例如: 8.8.8.8 或 google.com 或 2001:4860:4860::8888"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              variant="outlined"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePing();
                }
              }}
            />
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

