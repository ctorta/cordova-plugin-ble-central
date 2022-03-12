  
function notSupported() {
    console.log('BLE is not supported on the browser');
}

function formatUUID(uuid) {
    if (uuid.startsWith('0x')) {
        return parseInt(uuid);
    }
    if (/^[0-9a-fA-F]+$/.test(uuid)) {
        return parseInt(uuid, 16);
    }
    return uuid;
}

module.exports = {
    deviceInfos: new Map(),
    
    scan: function(services, seconds, success, failure) {
        if (!navigator.bluetooth) {
            failure('Bluetooth is not supported on this browser.');
            return;
        }

        let options = {};

        if (services && services.length) {
            options.filters = [{
                services: services.map(formatUUID)
            }];
        } else {
            options.acceptAllDevices = true;
        }

        navigator.bluetooth.requestDevice(options).then(device => {
            this.deviceInfos.set(device.id, {
                device: device
            });
            success({ id: device.id });
        }).catch(failure);
    },
    stopScan: function(success, failure) {
        if (success) success();
    },
    startScanWithOptions: function(services, options, success, failure) {
        let requestDeviceOptions = {};

        if (services && services.length) {
            requestDeviceOptions.filters = [{
                services: services.map(formatUUID)
            }];
        } else {
            requestDeviceOptions.acceptAllDevices = true;
        }

        navigator.bluetooth.requestDevice(requestDeviceOptions).then(device => {
            this.deviceInfos.set(device.id, {
                device: device
            });
            success({ id: device.id });
        }).catch(failure);
    },
    connect: function(deviceId, success, failure) {
        const connectGatt = (gatt) => {
            return gatt.connect().then(server => {
                this.deviceInfos.set(deviceId, {
                    device: deviceInfo,
                    server: server
                })
                success();
            }).catch(err => {
                if (failure) failure(err);
            });
        };

        const deviceInfo = this.deviceInfos.get(deviceId);
        if (!deviceInfo) {
            return navigator.bluetooth.getDevices().then(devices => {
                for (const device of devices) {
                    if (device.id === deviceId) {
                        return connectGatt(device.gatt);
                    }
                }
                if (failure) failure(new Error('device not found'));
            });
        }
        if (deviceInfo.server) {
            success();
        } else {
            return connectGatt(deviceInfo.device.gatt);
        }
    },
    disconnect: function(deviceId, success, failure) {
        if (this.deviceInfos.has(deviceId)) {
            var device = this.deviceInfos.get(deviceId).device;
            this.deviceInfos.delete(deviceId);
            if (device.gatt.connected) {
                device.gatt.disconnect();
                success(device);
            } else {
                success();
            }
        } else if (failure) {
            failure();
        }
    },
    read: function(deviceId, service_uuid, characteristic_uuid, success, failure) {
       if (this.deviceInfos.has(deviceId)) {
            this.deviceInfos.get(deviceId).server.getPrimaryService(formatUUID(service_uuid)).then(service => {
                return service.getCharacteristic(formatUUID(characteristic_uuid));
            }).then(characteristic => {
                return characteristic.readValue();
            }).then(result => {
                success(result);
            }).catch(error => {
                if (failure) failure(error);
            });
        } else if (failure) { 
          failure();
        }
    },
    readRSSI: function(deviceId, success, failure) {
        notSupported();
        if (failure) failure(new Error("not supported"));
    },
    write: function(deviceId, service_uuid, characteristic_uuid, data, success, failure) {
        if (this.deviceInfos.has(deviceId)) {
            this.deviceInfos.get(deviceId).server.getPrimaryService(formatUUID(service_uuid)).then(service => {
                return service.getCharacteristic(formatUUID(characteristic_uuid));
            }).then(characteristic => {
                return characteristic.writeValueWithResponse(data);
            }).then(result => {
                success(result);
            }).catch(error => {
                if (failure) failure(error);
            });
        } else if (failure) { 
          failure(new Error("device not connected"));
        }
    },
    writeWithoutResponse: function(deviceId, service_uuid, characteristic_uuid, data, success, failure) {
        if (this.deviceInfos.has(deviceId)) {
            this.deviceInfos.get(deviceId).server.getPrimaryService(formatUUID(service_uuid)).then(service => {
                return service.getCharacteristic(formatUUID(characteristic_uuid));
            }).then(characteristic => {
                return characteristic.writeWithoutResponse(data);
            }).then(result => {
                success(result);
            }).catch(error => {
                if (failure) failure(error);
            });
        } else if (failure) { 
            failure(new Error("device not connected"));
        }
    },
    startNotification: function(deviceId, service_uuid, characteristic_uuid, success, failure) {
         if (this.deviceInfos.has(deviceId)) {
            this.deviceInfos.get(deviceId).server.getPrimaryService(formatUUID(service_uuid)).then(service => {
                return service.getCharacteristic(formatUUID(characteristic_uuid));
            }).then(characteristic => {
                return characteristic.startNotifications().then(result => {
                    characteristic.addEventListener('characteristicvaluechanged', function (event) {
                        success(event.target.value.buffer);
                    });
                });
            }).catch(error => {
                if (failure) failure(error);
            })
        } else if (failure) { 
            failure(new Error("device not connected"));
        }
    },
    stopNotifcation: function(deviceId, service_uuid, characteristic_uuid, success, failure) {
       if (this.deviceInfos.has(deviceId)) {
            this.deviceInfos.get(deviceId).server.getPrimaryService(formatUUID(service_uuid)).then(service => {
                return service.getCharacteristic(formatUUID(characteristic_uuid));
            }).then(characteristic => {
                return characteristic.stopNotifications();
            }).then(result => {
                success(result);
            }).catch(error => {
                if (failure) failure(error);
            });
        } else if (failure) { 
            failure(new Error("device not connected"));
        }
    },
    isEnabled: function(success, failure) {
        notSupported();
        if (failure) failure(new Error("not supported"));
    },
    isConnected: function(deviceId, success, failure) {
        if (this.deviceInfos.has(deviceId)) {
            var device = this.deviceInfos.get(deviceId).device;
            if (device.gatt.connected) {
                success();
            } else {
                if (failure) failure();
            }
        } else if (failure) {
            failure();
        }
    },
    showBluetoothSettings: function(success, failure) {
        notSupported();
        if (failure) failure(new Error("not supported"));
    },
    enable: function(success, failure) {
        notSupported();
        if (failure) failure(new Error("not supported"));
    },
    startStateNotifications: function(success, failure) {
        notSupported();
        if (failure) failure(new Error("not supported"));
    },
    stopStateNotifications: function(success, failure) {
        notSupported();
        if (failure) failure(new Error("not supported"));
    }
};
