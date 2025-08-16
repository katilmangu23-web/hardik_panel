import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Smartphone, X } from 'lucide-react';
import { DeviceInfo } from '@/data/db';
import { useToast } from '@/hooks/use-toast';

interface SendSMSDialogProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceInfo;
  deviceId: string;
}

export function SendSMSDialog({ isOpen, onClose, device, deviceId }: SendSMSDialogProps) {
  const [senderNumber, setSenderNumber] = useState('');
  const [simSlot, setSimSlot] = useState('sim0');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Mock SIM data - in real app this would come from device
  const simOptions = [
    { value: 'sim0', label: 'Sim 0 JIO - Jio' },
    { value: 'sim1', label: 'Sim 1 Airtel - Airtel' },
  ];

  const handleSendSMS = async () => {
    if (!senderNumber.trim() || !messageBody.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSending(false);
    
    toast({
      title: "SMS Sent Successfully!",
      description: `Message sent to ${senderNumber} from ${deviceId}`,
    });
    
    // Reset form and close dialog
    setSenderNumber('');
    setMessageBody('');
    onClose();
  };

  const handleClose = () => {
    setSenderNumber('');
    setMessageBody('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle className="text-lg font-semibold">Send SMS</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Information */}
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <Smartphone className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">{deviceId}</p>
          </div>

          {/* Sender Number */}
          <div className="space-y-2">
            <Label htmlFor="sender-number" className="text-sm font-medium">
              Sender Number
            </Label>
            <Input
              id="sender-number"
              placeholder="Enter number"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              className="w-full"
            />
          </div>

          {/* SIM Slot */}
          <div className="space-y-2">
            <Label htmlFor="sim-slot" className="text-sm font-medium">
              Sim Slot
            </Label>
            <Select value={simSlot} onValueChange={setSimSlot}>
              <SelectTrigger id="sim-slot">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {simOptions.map((sim) => (
                  <SelectItem key={sim.value} value={sim.value}>
                    {sim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <Label htmlFor="message-body" className="text-sm font-medium">
              Message Body
            </Label>
            <Textarea
              id="message-body"
              placeholder="Your message here"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Instructional Text */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            The SMS will be sent directly from the selected device. Ensure the device is online and has sufficient balance.
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendSMS}
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? 'Sending...' : 'Send SMS'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
