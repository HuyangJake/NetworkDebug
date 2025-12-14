import React, { useState } from 'react';
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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

const DNSResolve = () => {
  const [hostname, setHostname] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleResolve = async () => {
    if (!hostname.trim()) {
      setError('请输入域名或主机名');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.post('/api/dns-resolve', {
        hostname: hostname.trim(),
      });
      setResults(response.data);
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
            <TextField
              fullWidth
              label="域名或主机名"
              placeholder="例如: example.com 或 www.google.com"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              variant="outlined"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleResolve();
                }
              }}
            />
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

