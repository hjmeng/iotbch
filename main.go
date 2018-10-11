package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"google.golang.org/grpc"

	"github.com/Sirupsen/logrus"
	pb "github.com/deepthawtz/iotbch/protobuf"
)

var (
	thingspeakBaseURL = "https://api.thingspeak.com"
	rpcPort           = ":50051"
)

// PurpleAir represents JSON API payloads
type PurpleAir struct {
	ID                         int32   `json:"ID"`
	ThingspeakPrimaryID        string  `json:"THINGSPEAK_PRIMARY_ID"`
	ThingspeakPrimaryIDReadKey string  `json:"THINGSPEAK_PRIMARY_ID_READ_KEY"`
	Lat                        float64 `json:"Lat"`
	Lon                        float64 `json:"Lon"`
	Tempf                      int32   `json:"temp_f,string"`
}

// ThingSpeakChannel respresents JSON API channel feed data
type ThingSpeakChannel struct {
	Channel struct {
		Name string `json:"name"`
	} `json:"channel"`

	Feed []*struct {
		CreatedAt *time.Time `json:"created_at"`
		PM25      float64    `json:"field2,string"`
	} `json:"feeds"`
}

// DeviceFeed is the end format
type DeviceFeed struct {
	Name  string      `json:"device"`
	ID    int32       `json:"id"`
	Lat   float64     `json:"lat"`
	Lon   float64     `json:"lon"`
	Tempf int32       `json:"temp_f"`
	Feed  []*FeedItem `json:"feed"`
}

// FeedItem is a metric in a feed
type FeedItem struct {
	Timestamp int64   `json:"ts"`
	PM25      float64 `json:"pm2.5"`
}

func main() {
	data, err := ioutil.ReadFile("devices.json")
	if err != nil {
		logrus.Fatal(err)
	}

	var deviceList []*PurpleAir
	if err := json.Unmarshal(data, &deviceList); err != nil {
		logrus.Fatal(err)
	}

	ch := make(chan os.Signal, 1)
	signal.Notify(ch, syscall.SIGUSR2, syscall.SIGINT)
	go func() {
		sig := <-ch
		logrus.Infof("%s received, shutting down", sig)
		os.Exit(0)
	}()

	logrus.Info("Starting metric fetching daemon")
	for _, device := range deviceList {
		time.Sleep(time.Duration(5) * time.Second)
		go func(device *PurpleAir) {
			var end *time.Time
			for {
				var df DeviceFeed
				channelData, err := fetchChannelData(device, end)
				if err != nil {
					logrus.Fatal(err)
				}
				df.ID = device.ID
				df.Name = channelData.Channel.Name
				df.Lat = device.Lat
				df.Lon = device.Lon
				df.Tempf = device.Tempf

				if len(channelData.Feed) > 0 {
					startTimestamp := channelData.Feed[0].CreatedAt.Unix()
					for i, f := range channelData.Feed {
						var t int64
						if i == 0 {
							t = f.CreatedAt.Unix()
						} else {
							t = f.CreatedAt.Unix() - startTimestamp
						}

						item := &FeedItem{
							Timestamp: t,
							PM25:      f.PM25,
						}
						df.Feed = append(df.Feed, item)
					}

					if err := postDeviceMetrics(&df); err != nil {
						logrus.Fatal(err)
					}

					// j, err := json.MarshalIndent(df, "", "  ")
					// if err != nil {
					// 	logrus.Fatal(err)
					// }
					// if err := ioutil.WriteFile(fmt.Sprintf("feeds/%d.json", df.ID), j, 0644); err != nil {
					// 	logrus.Fatal(err)
					// }
					end = channelData.Feed[len(channelData.Feed)-1].CreatedAt
				}

				time.Sleep(time.Duration(6) * time.Minute)
			}
		}(device)
	}

	select {}
}

// https://www.mathworks.com/help/thingspeak/readdata.html
func thingspeakURL(channelID, channelKey string, end *time.Time) string {
	url := fmt.Sprintf("%s/channels/%s/feeds.json", thingspeakBaseURL, channelID)
	url += fmt.Sprintf("?api_key=%s", channelKey)
	url += "&results=38"
	if end != nil {
		url += fmt.Sprintf("&start=%s", strings.Join([]string{end.Format("2006-01-02"), "%20", end.Format("15:04:05")}, ""))
	}
	return url
}

func fetchChannelData(device *PurpleAir, end *time.Time) (*ThingSpeakChannel, error) {
	url := thingspeakURL(device.ThingspeakPrimaryID, device.ThingspeakPrimaryIDReadKey, end)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	t := &ThingSpeakChannel{}
	data, _ := ioutil.ReadAll(resp.Body)
	if err := json.Unmarshal(data, &t); err != nil {
		return nil, err
	}
	logrus.WithFields(logrus.Fields{"id": device.ID, "url": url, "count": len(t.Feed), "status": resp.Status}).Info("GET device channel feed")

	return t, nil
}

func buildMetrics(df *DeviceFeed) *pb.Device {
	items := []*pb.FeedItem{}
	for _, f := range df.Feed {
		items = append(items, &pb.FeedItem{
			Ts:    f.Timestamp,
			Pm_25: f.PM25,
		})
	}

	return &pb.Device{
		Id:        df.ID,
		Name:      df.Name,
		Latitude:  df.Lat,
		Longitude: df.Lon,
		TempF:     df.Tempf,
		Feed: &pb.Feed{
			DeviceId:  df.ID,
			FeedItems: items,
		},
	}
}

func postDeviceMetrics(df *DeviceFeed) error {
	conn, err := grpc.Dial(rpcPort, grpc.WithInsecure())
	if err != nil {
		return err
	}
	defer conn.Close()

	client := pb.NewDeviceMetricsClient(conn)
	data := buildMetrics(df)

	logrus.WithFields(logrus.Fields{"id": df.ID}).Info("posting metrics to RPC")
	if _, err := client.AddDeviceMetrics(context.Background(), data); err != nil {
		return err
	}
	return nil
}
