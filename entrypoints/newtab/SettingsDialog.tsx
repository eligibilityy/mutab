import { Dialog } from "@base-ui/react/dialog";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Switch } from "@base-ui/react/switch";
import { X } from "lucide-react";
import {
  animateBackgroundItem,
  clockFormatItem,
  showDateItem,
  showRecentItem,
  type ClockFormat,
} from "@/lib/settings";
import type { WxtStorageItem } from "wxt/utils/storage";
import { useStorageValue } from "./useStorageValue";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SwitchSettingProps<M extends Record<string, unknown>> = {
  item: WxtStorageItem<boolean, M>;
  label: string;
};

function SwitchSetting<M extends Record<string, unknown>>({
  item,
  label,
}: SwitchSettingProps<M>) {
  const checked = useStorageValue(item);

  return (
    <label className="setting-row">
      <span>{label}</span>
      <Switch.Root
        className="switch"
        checked={checked === true}
        onCheckedChange={(next) => item.setValue(next)}
      >
        <Switch.Thumb className="switch-thumb" />
      </Switch.Root>
    </label>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const clockFormat = useStorageValue(clockFormatItem);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className="dialog-popup">
          <div className="dialog-header">
            <Dialog.Title className="dialog-title">Settings</Dialog.Title>
            <Dialog.Close className="dialog-close" aria-label="Close">
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <section className="setting-section">
            <h3 className="setting-heading">Clock</h3>
            <div className="setting-row">
              <span id="clock-format-label">Format</span>
              <RadioGroup
                aria-labelledby="clock-format-label"
                className="segmented"
                value={clockFormat}
                onValueChange={(value) =>
                  clockFormatItem.setValue(value as ClockFormat)
                }
              >
                <Radio.Root value="12h" className="segment">
                  12-hour
                </Radio.Root>
                <Radio.Root value="24h" className="segment">
                  24-hour
                </Radio.Root>
              </RadioGroup>
            </div>
            <SwitchSetting item={showDateItem} label="Show date" />
          </section>

          <section className="setting-section">
            <h3 className="setting-heading">Appearance</h3>
            <SwitchSetting
              item={animateBackgroundItem}
              label="Animate background"
            />
          </section>

          <section className="setting-section">
            <h3 className="setting-heading">Home</h3>
            <SwitchSetting item={showRecentItem} label="Show recently played" />
          </section>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
