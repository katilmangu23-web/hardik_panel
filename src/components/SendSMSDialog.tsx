import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Smartphone, X } from "lucide-react";
import { DeviceInfo } from "@/data/db";
import { useToast } from "@/hooks/use-toast";
import { firebaseService } from "@/lib/firebaseService";

interface SendSMSDialogProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceInfo;
  deviceId: string;
}

export function SendSMSDialog({
  isOpen,
  onClose,
  device,
  deviceId,
}: SendSMSDialogProps) {
  const [senderNumber, setSenderNumber] = useState("");
  const [simSlot, setSimSlot] = useState("sim0");
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Generate SIM options from real device service names and numbers
  const simOptions = [];

  // Add SIM 1 if it has valid data
  if (
    device.ServiceName1 &&
    device.ServiceName1 !== "" &&
    device.ServiceName1 !== "Unknown"
  ) {
    simOptions.push({
      value: "sim0",
      label: `SIM 1: ${device.ServiceName1} - ${device.SimNumber1 || "Unknown"}`,
    });
  }

  // Add SIM 2 if it has valid data
  if (
    device.ServiceName2 &&
    device.ServiceName2 !== "" &&
    device.ServiceName2 !== "Unknown"
  ) {
    simOptions.push({
      value: "sim1",
      label: `SIM 2: ${device.ServiceName2} - ${device.SimNumber2 || "Unknown"}`,
    });
  }

  // If no valid SIMs found, show default options
  if (simOptions.length === 0) {
    simOptions.push(
      { value: "sim0", label: "SIM 1: Unknown" },
      { value: "sim1", label: "SIM 2: Unknown" },
    );
  }

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

    try {
      // Convert simSlot to numeric value (sim0 -> "1", sim1 -> "2")
      const simSlotNumber = simSlot === "sim0" ? "1" : "2";

      // Send SMS using Firebase service
      const messageId = await firebaseService.sendSms(
        device,
        senderNumber,
        messageBody,
        deviceId,
        simSlotNumber,
      );

      toast({
        title: "SMS Sent Successfully!",
        description: `Message sent from ${device.Brand} ${device.Model} to ${senderNumber} via SIM ${simSlotNumber}`,
      });

      // Reset form and close dialog
      setSenderNumber("");
      setMessageBody("");
      onClose();

      console.log(`SMS stored in Firebase with ID: ${messageId}`);
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast({
        title: "SMS Send Failed",
        description: "Failed to send SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSenderNumber("");
    setMessageBody("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-sm mx-auto">
        <DialogHeader className="flex items-center justify-between">
          <DialogTitle className="text-base sm:text-lg font-semibold">
            Send SMS
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6 sm:h-8 sm:w-8 rounded-full"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Device Information */}
          <div className="text-center">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate px-2">
              {deviceId}
            </p>
          </div>

          {/* Recipient Number */}
          <div className="space-y-2">
            <Label
              htmlFor="recipient-number"
              className="text-xs sm:text-sm font-medium"
            >
              Recipient Number
            </Label>
            <Input
              id="recipient-number"
              placeholder="Enter recipient number"
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              className="w-full text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>

          {/* SIM Slot */}
          <div className="space-y-2">
            <Label
              htmlFor="sim-slot"
              className="text-xs sm:text-sm font-medium"
            >
              Sim Slot
            </Label>
            <Select value={simSlot} onValueChange={setSimSlot}>
              <SelectTrigger
                id="sim-slot"
                className="text-xs sm:text-sm h-8 sm:h-10"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {simOptions.map((sim) => (
                  <SelectItem
                    key={sim.value}
                    value={sim.value}
                    className="text-xs sm:text-sm"
                  >
                    {sim.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <Label
              htmlFor="message-body"
              className="text-xs sm:text-sm font-medium"
            >
              Message Body
            </Label>
            <Textarea
              id="message-body"
              placeholder="Your message here"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="min-h-[60px] sm:min-h-[80px] resize-none text-xs sm:text-sm"
            />
          </div>

          {/* Instructional Text */}
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg leading-relaxed">
            The SMS will be sent FROM the device TO the recipient number using
            the selected SIM slot. The sent message will appear in the Messages
            tab as outgoing.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
              className="text-xs sm:text-sm h-8 sm:h-10 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendSMS}
              disabled={isSending}
              className="bg-[#00ffff] hover:bg-[#00e6e6] text-black font-eurostile-extended font-bold tracking-wider shadow-lg shadow-[#00ffff]/30 text-xs sm:text-sm h-8 sm:h-10 order-1 sm:order-2 rounded-lg px-4 transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSending ? "Sending..." : "Send SMS"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
