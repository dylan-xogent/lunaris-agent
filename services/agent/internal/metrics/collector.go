package metrics

import (
	"net"
	"strings"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

// SystemMetrics contains system performance metrics
type SystemMetrics struct {
	CPUUsage    float64
	MemoryUsage float64
	DiskUsage   float64
}

// Collect gathers current system metrics
func Collect() (*SystemMetrics, error) {
	metrics := &SystemMetrics{}

	// CPU usage (average across all cores, 1 second sample)
	cpuPercent, err := cpu.Percent(0, false)
	if err == nil && len(cpuPercent) > 0 {
		metrics.CPUUsage = cpuPercent[0]
	}

	// Memory usage
	memInfo, err := mem.VirtualMemory()
	if err == nil {
		metrics.MemoryUsage = memInfo.UsedPercent
	}

	// Disk usage (C: drive on Windows)
	diskInfo, err := disk.Usage("C:")
	if err == nil {
		metrics.DiskUsage = diskInfo.UsedPercent
	}

	return metrics, nil
}

// GetPrimaryIP returns the primary non-loopback IP address
func GetPrimaryIP() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return ""
	}

	for _, iface := range interfaces {
		// Skip loopback and down interfaces
		if iface.Flags&net.FlagLoopback != 0 || iface.Flags&net.FlagUp == 0 {
			continue
		}

		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			// Skip loopback and IPv6
			if ip == nil || ip.IsLoopback() || ip.To4() == nil {
				continue
			}

			return ip.String()
		}
	}

	return ""
}

// GetPrimaryMAC returns the MAC address of the primary network interface
func GetPrimaryMAC() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return ""
	}

	for _, iface := range interfaces {
		// Skip loopback and down interfaces
		if iface.Flags&net.FlagLoopback != 0 || iface.Flags&net.FlagUp == 0 {
			continue
		}

		// Skip virtual interfaces (common on Windows)
		name := strings.ToLower(iface.Name)
		if strings.Contains(name, "virtual") ||
			strings.Contains(name, "vmware") ||
			strings.Contains(name, "hyper-v") {
			continue
		}

		if len(iface.HardwareAddr) > 0 {
			return iface.HardwareAddr.String()
		}
	}

	return ""
}

