package api

import (
	"net/http"

	"github.com/getsentry/sentry-go"
	"github.com/grafana/grafana/pkg/api/frontendlogging"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/web"
)

var frontendLogger = log.New("frontend")

type frontendLogMessageHandler func(c *models.ReqContext) response.Response

func NewFrontendLogMessageHandler(store *frontendlogging.SourceMapStore) frontendLogMessageHandler {
	return func(c *models.ReqContext) response.Response {
		event := frontendlogging.FrontendSentryEvent{}
		if err := web.Bind(c.Req, &event); err != nil {
			return response.Error(http.StatusBadRequest, "bad request data", err)
		}

		var msg = "unknown"

		if len(event.Message) > 0 {
			msg = event.Message
		} else if event.Exception != nil && len(event.Exception.Values) > 0 {
			msg = event.Exception.Values[0].FmtMessage()
		}

		var ctx = event.ToLogContext(store)

		switch event.Level {
		case sentry.LevelError:
			frontendLogger.Error(msg, ctx...)
		case sentry.LevelWarning:
			frontendLogger.Warn(msg, ctx...)
		case sentry.LevelDebug:
			frontendLogger.Debug(msg, ctx...)
		default:
			frontendLogger.Info(msg, ctx...)
		}

		return response.Success("ok")
	}
}

func GrafanaJavascriptAgentLogMessageHandler(store *frontendlogging.SourceMapStore) frontendLogMessageHandler {
	return func(c *models.ReqContext) response.Response {
		event := frontendlogging.FrontendGrafanaJavascriptAgentEvent{}
		if err := web.Bind(c.Req, &event); err != nil {
			return response.Error(http.StatusBadRequest, "bad request data", err)
		}
		var ctx = frontendlogging.CtxVector{}

		// Meta object is standard across event types, adding it globally.
		ctx = event.AddMetaToContext(ctx)

		if event.Logs != nil && len(event.Logs) > 0 {
			for _, logEntry := range event.Logs {
				ctx = append(ctx, "kind", "log", "original_timestamp", logEntry.Timestamp)
				if logEntry.LogLevel != "" {
					ctx = append(ctx, "original_log_level", logEntry.LogLevel)
				}
				for k, v := range frontendlogging.KeyValToInterfaceMap(logEntry.KeyValContext()) {
					ctx = append(ctx, k, v)
				}
				frontendLogger.Info(logEntry.Message, ctx...)
			}
		}

		if event.Measurements != nil && len(event.Measurements) > 0 {
			for _, measurementEntry := range event.Measurements {
				for measurementName, measurementValue := range measurementEntry.Values {
					ctx = append(ctx, measurementName, measurementValue)
					ctx = append(ctx, "kind", "measurement", "original_timestamp", measurementEntry.Timestamp)
					frontendLogger.Info("Measurement: "+measurementEntry.Type, ctx...)
				}
			}
		}
		if event.Exceptions != nil && len(event.Exceptions) > 0 {
			for _, exception := range event.Exceptions {
				exception := exception
				transformedException := frontendlogging.TransformException(&exception, store)
				ctx = append(ctx, "kind", "exception", "type", transformedException.Type, "value", transformedException.Value, "stacktrace", transformedException.String())
				ctx = append(ctx, "original_timestamp", exception.Timestamp)
				frontendLogger.Error(exception.Message(), ctx...)
			}
		}
		return response.Success("ok")
	}
}
