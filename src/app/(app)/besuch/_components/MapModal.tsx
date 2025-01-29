import type React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import MapViewModal from "./MapViewModal";
import { X } from "lucide-react";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude?: number;
  longitude?: number;
  name: string;
  campsiteLatitude: number;
  campsiteLongitude: number;
}

const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  latitude,
  longitude,
  name,
  campsiteLatitude,
  campsiteLongitude,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/50 z-40" />

        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-visible rounded-2xl bg-background border-2 border-foreground text-left align-middle shadow-xl transition-all h-[90vh] p-0 flex flex-col z-50">
                <div className="absolute -top-6 -right-6 z-50">
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:text-orange-500 transition-colors text-orange-400"
                    aria-label="Schließen"
                  >
                    <X className="h-10 w-10" />
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden rounded-2xl">
                  <MapViewModal
                    latitude={latitude ?? 0}
                    longitude={longitude ?? 0}
                    name={name}
                    campsiteLatitude={campsiteLatitude}
                    campsiteLongitude={campsiteLongitude}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MapModal;
