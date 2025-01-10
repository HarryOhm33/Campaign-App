import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import axios from '../config/axios';

function AdminPanel() {
  const [value, setValue] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);

  const fetchPendingCampaigns = useCallback(async () => {
    try {
      const response = await axios.get(
        `/admin/campaigns/pending?page=${page + 1}&limit=${rowsPerPage}`
      );
      setCampaigns(response.data.campaigns);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch campaigns');
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (value === 0) {
      fetchPendingCampaigns();
    }
  }, [value, fetchPendingCampaigns]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleReviewCampaign = async (id, status) => {
    try {
      await axios.put(`/admin/campaigns/${id}/review`, { status });
      fetchPendingCampaigns();
    } catch (error) {
      setError('Failed to review campaign');
    }
  };

  const handleBulkApprove = async () => {
    try {
      await axios.post('/admin/campaigns/bulk-approve', {
        campaignIds: selectedCampaigns,
      });
      setSelectedCampaigns([]);
      fetchPendingCampaigns();
    } catch (error) {
      setError('Failed to approve campaigns');
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await axios.get('/admin/campaigns/download', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'campaigns.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Failed to download campaigns');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={value} onChange={handleTabChange}>
          <Tab label="Pending Campaigns" />
          <Tab label="Invoice Upload" />
        </Tabs>
      </Paper>

      {value === 0 && (
        <>
          <Box display="flex" gap={2} mb={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBulkApprove}
              disabled={selectedCampaigns.length === 0}
            >
              Approve Selected
            </Button>
            <Button
              variant="contained"
              onClick={handleDownloadAll}
              startIcon={<DownloadIcon />}
            >
              Download All
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign._id}>
                    <TableCell>{campaign.name}</TableCell>
                    <TableCell>
                      {campaign.userId.firstName} {campaign.userId.lastName}
                    </TableCell>
                    <TableCell>
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        color="primary"
                        onClick={() => handleReviewCampaign(campaign._id, 'approved')}
                        startIcon={<ApproveIcon />}
                      >
                        Approve
                      </Button>
                      <Button
                        color="error"
                        onClick={() => handleReviewCampaign(campaign._id, 'rejected')}
                        startIcon={<RejectIcon />}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={-1}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </>
      )}

      {value === 1 && (
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Invoice Upload Feature Coming Soon
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default AdminPanel;
