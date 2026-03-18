{{- define "ubuntu-pools.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "ubuntu-pools.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "ubuntu-pools.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "ubuntu-pools.labels" -}}
helm.sh/chart: {{ include "ubuntu-pools.chart" . }}
{{ include "ubuntu-pools.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "ubuntu-pools.selectorLabels" -}}
app.kubernetes.io/name: {{ include "ubuntu-pools.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
