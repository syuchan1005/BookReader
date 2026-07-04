import { authClient } from '@client/auth';
import {
  Button,
  Icon,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';

const getRemainingTime = (expiresAtStr: string) => {
  const diff = new Date(expiresAtStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  const mins = Math.floor((diff / 1000 / 60) % 60);
  if (mins > 0) return `in ${mins} min${mins > 1 ? 's' : ''}`;
  return 'Expires soon';
};

export const ApiKeyPane = () => {
  const theme = useTheme();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState<number>(1);
  const [createdKey, setCreatedKey] = useState<string | undefined>(undefined);
  const [createKeyLoading, setCreateKeyLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchApiKeys = async () => {
    const { data } = await authClient.apiKey.list({});
    if (data && data.apiKeys) {
      setApiKeys(data.apiKeys);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCreateApiKey = async () => {
    setCreateKeyLoading(true);
    const expiresIn = newKeyExpiry * 24 * 60 * 60;
    const { data } = await authClient.apiKey.create({
      name: newKeyName || 'project-api-key',
      expiresIn,
    });
    setCreateKeyLoading(false);
    if (data) {
      setCreatedKey(data.key);
      setCopied(false);
      setNewKeyName('');
      setNewKeyExpiry(1);
      fetchApiKeys();
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    await authClient.apiKey.delete({ keyId });
    setCreatedKey(undefined);
    fetchApiKeys();
  };

  return (
    <>
      <Typography variant="h6" style={{ marginTop: theme.spacing(4) }}>
        API Keys
        <IconButton
          size="small"
          style={{ marginLeft: theme.spacing(1) }}
          onClick={() => fetchApiKeys()}
        >
          <Icon>refresh</Icon>
        </IconButton>
      </Typography>

      <div style={{ display: 'flex', gap: theme.spacing(1), marginBottom: theme.spacing(2), alignItems: 'center' }}>
        <TextField
          size="small"
          label="Name"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
        />
        <TextField
          size="small"
          label="Expiry (Days, Max 90)"
          type="number"
          style={{ minWidth: '180px' }}
          slotProps={{
            htmlInput: { min: 1, max: 90 },
          }}
          value={newKeyExpiry}
          onChange={(e) => {
            setNewKeyExpiry(Number(e.target.value));
          }}
        />
        <Button
          variant="contained"
          onClick={handleCreateApiKey}
          disabled={createKeyLoading || !newKeyName.trim()}
        >
          Create
        </Button>
      </div>

      {createdKey && (
        <div style={{ marginBottom: theme.spacing(2), padding: theme.spacing(2), border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" color="error">
            Make sure to copy your API key now. You won't be able to see it again!
          </Typography>
          <div style={{ display: 'flex', gap: theme.spacing(1), alignItems: 'center', marginTop: theme.spacing(1) }}>
            <Typography variant="body1" style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>{createdKey}</Typography>
            <Button
              size="small"
              color={copied ? "success" : "primary"}
              onClick={() => {
                navigator.clipboard.writeText(createdKey);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">Name</TableCell>
              <TableCell align="left">Created At</TableCell>
              <TableCell align="left">Expires At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell align="left">{key.name || 'Unnamed'}</TableCell>
                <TableCell align="left">{new Date(key.createdAt).toISOString()}</TableCell>
                <TableCell align="left">
                  {key.expiresAt ? (
                    `${new Date(key.expiresAt).toISOString()} (${getRemainingTime(key.expiresAt)})`
                  ) : (
                    'Never'
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRevokeApiKey(key.id)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
