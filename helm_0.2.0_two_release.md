

[TOC]



# 1. Common Helm Chart File Structure

以下是common helm chart中已有的文件，project team不需要自己配置
```text
common-configmap.yaml             # als configmap yaml file,
common-deployment.yaml            # deployment template yaml file.
common-destinationRule.yaml       # destinationRule template yaml file.
common-gateway.yaml               # istio ingress gateway template yaml file.
common-healthcheck.yaml           # itsp healthcheck cronjob template yaml file.
common-hpa.yaml                   # hpa template yaml file.
common-service.yaml               # service template yaml file.
common-sidecar.yaml               # istio sidecar template yaml file.
common-virtualService.yaml        # virtualService template yaml file.
```



# 2. How To Use Common Helm Chart ?

### 2.1 Chart.yaml


```yaml
    
apiVersion: v2  
name: chart-test  
description: A Helm chart for Kubernetes  

type: application  

version: 0.1.0  

dependencies:  
- name: common  # the chart name
  version: 0.2.0  # the chart version 
  repository: https://hagithub.home/pages/eHRSS/ehrss-helm/ # the chart address  

```



### 2.2 Values.yaml

------

##### 2.2.1 配置项目基本信息

```yaml
common:    
  application:    
    productCode: ehrss  ## Optional.
    sgrServiceCode: HELM_CHART_DEMO-TEST  ## serviceCode registered in sgr
    type: svc ## Optional, 可以配置为 svc or app
    version: '4'  
    minorVersion: '1' ## Optional, default value: '0'  
    patchVersion: '2' ## Optional, default value: '0'  
    replicaCount: 1  ## 需要部署的pod的数量，如果配置了hpa，这个配置可以忽略
    alertProjectCode: HELM  ## als使用的alert project code
    module: HELM 
    env: "dev" ## Please include this in values-<env>.yaml file
    
    ## Optional, 只有配置了以下两个配置，才有canary的效果，可以使用itsp来实现蓝绿切换
    previousVersion: 4.1.1 ## 配置上一个稳定版本的版本号，示例配置后产生效果: 100%流量指向4.1.1 (stable version)，0%流量指向4.1.2 (new version)
    stableReplicas: 1  ## 上一个稳定版本的实例数
      
  resources:     
    limits:    
      cpu: 100m    
      memory: 128Mi    
      ephemeral-storage: 300Mi ## Optional, default value: 300Mi 
      ## 只需要配置limit，不需要配置request，ocp会默认配置:
      ## request.cpu = limits.cpu * 0.1
      ## request.memory = limits.memory * 0.8

  service:    
    port: 8080    
    ## If the Service used the NodePort type, add the following    
    #type: NodePort    
    #nodePort: 30300  
  ## 2. multiple services  
  service:    
    - port: 8081  
    - port: 8082    
      name: test  
      ## Optional , If the Service used the NodePort type, add the following    
      #type: NodePort    
      #nodePort: 30300
  ## Optional , Add sidecarsService.port to export the sidecar container target port
  sidecarsService:
    port: 9113  ## export port number(usually same as target port)

```



##### 2.2.2 配置环境变量

```yaml
common:
  ## Env values such as als and eapm, have been added in common. Do not need to configure  
  ## If have other env exist, please configure them here   
  extraEnvVars:    
    - name: TEST   # 直接配置key,value
      value: test    
    - name: PASSWORD  # 通过secret的方式配置env,比较常用于pwd
      valueFrom:    
        secretKeyRef:    
          name: secretName    
          key: key
    - name: ENV   # 通过configmap的方式配置env
      valueFrom:
        configMapKeyRef:
          name: configmapName  
          key: key
   ## Above is configured in list form. If different values need to be configured for different env, it requires the entire object to be replaced. If there is such a requirement, you can switch to configure it in map form.   
  extraEnvVars:  
    test:  
      name: TEST    
      value: test    
    pwd:  
      name: PASSWORD    
      valueFrom:    
        secretKeyRef:    
          name: secretName    
          key: key  
    env:
      name: ENV
      valueFrom:
        configMapKeyRef:
          name: configmapName
          key: key
  
  ## Use envFrom to define all of the ConfigMap's data as container environment variables. The key from the ConfigMap becomes the environment variable name in the Pod.   
  extraEnvVarsCM:    
    - name: ehrss-helm-chart-demo-testcm-svc-4-0-0-configmap   
  ## If configure suffix,will converted in common helm chart 
  ## format: productCode-sgrServiceCode-suffix-type-version-configmap
  ## 如下配置，将得到结果: ehrss-helm-chart-demo-test-svc-4-0-0-configmap 
    #- suffix: test     
      
  ## like 'extraEnvVarsCM'
  extraEnvVarsSecret:    
     - name: ehrss-helm-chart-demo-test-svc-4-0-0-secret    
     #- suffix: test  
```

> *ref:*  [*https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/*](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)

<font color='##6678CB'>***env***</font>

*allows you to set environment variables for a container, specifying a value directly for each variable that you name.*

<font color='##6678CB'>***envFrom***</font>

*allows you to set environment variables for a container by referencing either a ConfigMap or a Secret. When you use `envFrom`, all the key-value pairs in the referenced ConfigMap or Secret are set as environment variables for the container. You can also specify a common prefix string.*



##### 2.2.3 配置挂载(cm/secret/pvc)

```yaml
common:
  ## Volumes in deployment, can configure name or suffix or empty.    
  extraVolumes:    
    configMap:    
      application: 
        ##如果不填name或者只填写了suffix，common helm chart 会生成一个name
        ## format: productCode-sgrServiceCode-{suffix}-type-version-configmap -->suffix可不填
        ## name: ehrss-helm-chart-demo-svc-4-0-0-configmap ## Optional  
        path: /usr/local/cloud/config/application.yml    
        subPath: application.yaml  ## Optional. 如果配置了subPath,挂载只会替换这个指定的文件或者文件夹，如果不配置表示替换整个/usr/local/cloud/config/目录, 注意:如果配置了subpath. pod will not receive Secret updates
    secret:    
      dbpwd:     
         name: ehrss-helm-chart-demo-test-svc-4-0-0-secret ## Optional   
         path: /test    
         subPath: filename  ## Optional   
    pvc:    
      doc:    
        path: /pvc    
        subPath: pvc  ## Optional   
        suffix: filename  ## Optional 
```

> *ref:*  [*https://kubernetes.io/docs/concepts/storage/volumes/*](https://kubernetes.io/docs/concepts/storage/volumes/)

<font color='##6678CB'>***configmap***</font>

*A `configmap` provides a way to inject configuration data into pods. The data stored in a ConfigMap can be referenced in a volume of type `configMap` and then consumed by containerized applications running in a pod.*

<font color='##6678CB'>***secret***</font>

*A `secret` volume is used to pass sensitive information, such as passwords, to Pods.* 

<font color='##6678CB'>***persistentVolumeClaim***</font>

*A `persistentVolumeClaim` volume is used to mount a PersistentVolumeinto a Pod. PersistentVolumeClaims are a way for users to "claim" durable storage (such as an iSCSI volume) without knowing the details of the particular cloud environment.*



##### 2.3.4 配置各组件(0.2.0版本已经set了默认值,所以如果跟默认值一样,可以移除这块配置)

```yaml
component:
  ## Optional , default value: true
  ## 开启后，会加入als部署需要的配置，例如configmap，deployment.env等
  als:      
    enabled: true    
    ## default configuration: debugLogLevel: 10    
    ## If you have additional values to configure, please add the following    
    #config:    
    #  debugLogLevel: 40    
    #  fileLogPath: /appl/als_log 

  ## Optional. Default value: true   
  ## 开启后，会加入eapm部署需要的配置
  eapm:    
    enabled: true
    ## Node Project ,do as follows  
    type: Node  
    ## Optional. Default Value: /usr/src/app/cert/root_ca.cer  
    config:  
      cacert: xxxxx  
     
  ## Optional. Default value: false   
  ## 开启后，会将pod的/logs文件挂载到CLAP中，一般JAVA项目需要开启.
  volumeLogs:  
    enabled: false
    
  ## 以下组件，application如果有使用就需要配置true.
  ##----
  ## Optional. Default value: false  
  ucp:    
    enabled: false    
  ## Optional. Default value: false  
  mongo:    
    enabled: false   
  ## Optional. Default value: false  
  redis:    
    enabled: false   
  ## Optional. Default value: false  
  amq:    
    enabled: false
  ##----
  
  ## Optional 
  otherExclude:  
    port: 123,123,123 ## Optional,Use commas to separate
    ipRange: 1.1.1.1,1.1.1.2 ## Optional,Use commas to separate
   
  ## Optional. Default value: true. 开启后可以在ITSP监控application
  supportPortalMonitoring:  
    enabled: true  

  ## Optional. Default value: false  
  conjur:  
    enabled: true  
    config:  
      hostId: host/CONJUR-DEMO-TEST  
      ## Optinal. Default value: init. 如果只是启动时获取一次pwd，配置为'init',如果application在启动后每一次都需要获取新的pwd,配置为'sidecar'.大部分项目应该使用默认值init，可以不配置mode.
      mode: sidecar 
   
   ## For Support Portal Healthcheck Cronjob. Default value: false  
   healthCheck:    
     enabled: true    
     config:    
       schedule: 0,15,30,45 * * * *    
       url: /healthcheckApi    
       type: 'POST' or 'GET'  
       ## If there is no input, do not need to configure    
       requestParam: ['test1:test1','test2:test2','test3:test3','test4:test4']    
       ## Default headers: {"header0":"EHR_SER_CD:%s","header1":"EHR_SER_MAJ:%s","header2":"EHR_SER_MIN:%s"}, If you have additional values to configure, add the following    
       requestHeader: ['test1:test1','test2:test2','test3:test3','test4:test4']    
       ## Need to be json Format    
       requestBody: {"test":"test"}   
```

> Tips: 如果有其他功能需要加入common helm, 请联系vickyyu@harmonycloud.cn



##### 2.2.5 配置istio

```yaml
istio: 
  enable: true  ## Optional. Default value: true
  ## If there is provider application, need to configure, do as follows
  sidecar:  
    - name: servicename  #support *
      ## Optional,如果跟application是相同的namespace,可以不配置,helm会自动生成
      namespace: ehrss-ext-core
  
  ## Optional. 如果有cloud外的请求，例如weblogic，set 'true'    
  ## 由于这块配置比较复杂，会给出几种不同场景的例子用做参考.
  ingress:    
    enabled: true    
    config:
      ## Optional. 由于每个环境的domain不一样，这个配置一般配在values-<env>.yaml中.
      cluster: apps.serverdev.ehr.gov.hk
      ## 0.2.0版本中，加入site来替代，防止project team遗漏配置.所以如果不配置cluster或者host的domain，需要配置site
      site: 'P' or 'S'
      ## Optional. 
      ## single host    
      host: helm-chart-svc-ehrss-test-dev.apps.serverdev.ehr.gov.hk
      ## multiple hosts    
      host:   
        - helm-chart-svc-ehrss-test-dev.apps.serverdev.ehr.gov.hk
        - helm-chart-svc-2-ehrss-test-dev.apps.serverdev.ehr.gov.hk
      ## single gateway  
      gateway: helm-chart-gw   
      ## multiple gateways    
      gateway:   
        - helm-chart-gw  
        - namespaces/helm-chart-gw-2  
   ## Optional. If vs needs to configure additional services,do as follows  
  virtualService:  
    - name: test1  
      match:  
      ## exact: "value" for exact string match  
      ## prefix: "value" for prefix - based match  
      ## regex: "value" for RE2 style regex - based match  
      ## URI and headers inside a ‘-’ represents an AND condition, which needs to be satisfied together. Different '-'s represent OR conditions.  
      - uri:  
          prefix: "/testapi"  
          ## exact: "/testapi"  
          ## regex: "\d+$"  
         headers:  
           HEADER1:  
             prefix: "helm"  
         method:  
           exact: "GET" ## Optional.HTTP Method values are case-sensitive  
      - headers:  
          HEADER2:  
            prefix: "helm2" 
      ## Optional.Rewrite HTTP URIs. Rewrite cannot be used with Redirect primitive. Rewrite will be performed before forwarding.  
      rewrite: "/v1/bookRatings"  
      ## Optional.A HTTP rule can either return a direct_response, redirect or forward (default) traffic.  
      redirect: "/v1/bookRatings"  
      ## Optional.Timeout for HTTP requests, default is disabled.  
      timeout: 5s  
      ## Optional.  
      retries:  
        attempts: 3 ## Number of retries to be allowed for a given request.  
        perTryTimeout: 2s ## Timeout per attempt for a given request  
        retryOn: connect-failure,refused-stream,503 ## Specifies the conditions under which retry takes place  
 

```

> *virtualService:* [*https://istio.io/latest/docs/reference/config/networking/virtual-service/*](https://istio.io/latest/docs/reference/config/networking/virtual-service/)
> *destinationRule:* [*https://istio.io/latest/docs/reference/config/networking/destination-rule/*](https://istio.io/latest/docs/reference/config/networking/destination-rule/)
>
> 1. mfa或者需要将自己系统接入pfw中，可参考:  [values.yaml](./_yaml/values_mfa.yaml),  产生的virtualService & destinationRule文件:  [vs_dr.yaml](./_yaml/vs_dr_mfa.yaml)
> 2. 外部系统只会通过当前应用的host访问该系统，例如cdvm，手机端部署在weblogic，只会直接访问cdvm.
>    1. host不带version，当majorVersion更新时，host不能变，可参考： [values.yaml](./_yaml/values_noversion.yaml),  产生的virtualService & destinationRule文件:  [vs_dr.yaml](vs_dr_noversion.yaml), 另外需要创建一个新的仓库，使用gateway chart 生成一个 route without version
>    2. host带version，当majorVersion更新时，host可以对应更新，可参考： [values.yaml](./_yaml/values_verison.yaml),  产生的virtualService & destinationRule文件:  [vs_dr.yaml](./_yaml/vs_dr_version.yaml)



##### 2.2.6 配置探针实现健康检查

```yaml
## 配置探针有很多种方式，httpGet/tcp/gRPC，具体配置可以参考官方网站
common:
  ## It is strongly suggested to include this config for enable openshift to monitor on your pod.
  ## eg.一个springboot应用，pod转为running状态后，会运行image command，即java -jar...,此时容器内的应用是不可用的，但是cloud在pod状态变为running后就会将endpoint开放给外部访问，此时请求会失败，如果配置了readinessProbe，cloud会在readinessProbe访问成功后才将endpoint开放到外部，应用一定是可用的.
  readinessProbe:  
    content:
      failureThreshold: 3
      httpGet:
        path: /healthcheck
        port: 8080
        scheme: HTTP
      initialDelaySeconds: 30
      periodSeconds: 60
        successThreshold: 1
        timeoutSeconds: 10
       
  livenessProbe: ## Please add this depends on your project needs
    content:
      failureThreshold: 3
      initialDelaySeconds: 40
      periodSeconds: 60
      successThreshold: 1
      tcpSocket:
        port: 8080
      timeoutSeconds: 1

  startUpProbe: ## Please add this depends on your project needs
    content:
	  httpGet:
	    path: /healthz
	    port: liveness-port
	  failureThreshold: 30
	  periodSeconds: 10

  ## 如果应用只是在一段时间内流量会增大，则考虑配置autoscaling,通过监控cpu等指标来实现自动扩缩容.合理使用集群资源.
  autoscaling: ## You may set enabled to false if don’t want to have auto scaling
    enabled: true ## Optinal. Default value: false
    minReplicas: 2
    maxReplicas: 3
    ## 如果这两个配置都没有使用，helm默认使用targetCPUPercentage: 700
    ## 由于autoscaling是根据request的值去计算的，例如一个应用，配置了cpu为1C,我们期望应用在cpu使用到0.7C时scaling up, request.cpu = limit.cpu * 0.1, 所以 limit.cpu * 0.7 = request.cpu * 700%
    targetCPUPercentage: 700  ## Optinal.
    targetMemoryPercentage: 125 ## Optinal.

```

> *probes:*  [*https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/*](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

> *autoScaling*: [*https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/*](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

<font color='##6678CB'>***readinessProbe***</font>

*Sometimes, applications are temporarily unable to serve traffic. For example, an application might need to load large data or configuration files during startup, or depend on external services after startup.Kubernetes provides readiness probes to detect and mitigate these situations. A pod with containers reporting that they are not ready does not receive traffic through Kubernetes Services.*

<font color='##6678CB'>***livenessProbe***</font>

*Many applications running for long periods of time eventually transition to broken states, and cannot recover except by being restarted. Kubernetes provides liveness probes to detect and remedy such situations.* 

<font color='##6678CB'>***startupProbe***</font>

*Sometimes, you have to deal with legacy applications that might require an additional startup time on their first initialization. In such cases, it can be tricky to set up liveness probe parameters without compromising the fast response to deadlocks that motivated such a probe. The trick is to set up a startup probe with the same command, HTTP or TCP check, with a failureThreshold periodSeconds long enough to cover the worst case startup time.*



##### 2.2.7 其他不常用配置(Optional)

```yaml
common:
  ## 自定义label
  labels:   
    test: helmchart  
  ## 自定义容器启动命令
  command: []  
    
  args: []  
  
  ## To specify security settings for a Pod or pod
  ## ref: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/
  podSecurityContext:  
    fsGroup: 2000  
  
  containerSecurityContext:  
    runAsUser: 100  
 
  ## 不是istio的sidecar, 在pod中多加入一个container,所以按照container yaml内容配置
  sidecars:  
    - name: your-name  
      image: your-image  
      imagePullPolicy: Always
      ports:  
        - containerPort: 1234  
  ## 调度pod到某些特定的node上，例如以下配置，会将pod调度到有label为 "host": ehrss7a的node上.
  nodeSelector:
    host: ehrss7a
  ## Kubernetes provides Containers with lifecycle hooks, the hooks enable Containers to be aware of events in their management lifecycle and run code implemented in a handler when the corresponding lifecycle hook is executed.
  ## ref: https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/
  lifecycle: {}
```

>  已在common helm 0.2.0版本统一处理
>
>  ~~affinity~~:
>      ~~podAntiAffinity:~~
>        ~~preferredDuringSchedulingIgnoredDuringExecution:~~
>          ~~- podAffinityTerm:~~
>              ~~labelSelector:~~
>                ~~matchExpressions:~~
>                  ~~- key: servicecode~~
>                    ~~operator: In~~
>                    ~~values:~~
>                      ~~- helm-chart-demo~~
>              ~~topologyKey: kubernetes.io/hostname~~
>            ~~weight: 100~~~~
>
>  



### 2.3 自定义yaml文件

##### 2.3.1 Values.yaml 

```yaml
common:  
  ##For now, only four options. Fill in the resources you want to customize   
  customize: [deployment,virtualService,destinationRule,sidecar]
  application:  
    productCode: ehrss  
    sgrServiceCode: helm-chart-demo  
    type: svc  
    version: '4'  
    replicaCount: 1  
    alertProjectCode: HELM  
    module: HELM
##add an application section which is same level as common
application:
  productCode: ehrss  
  sgrServiceCode: helm-chart-demo  
  type: svc  
  version: '4'  
  replicaCount: 1  
  alertProjectCode: HELM  
  module: HELM  

```

> You may put following tags in yaml name / label if you do not want to check and follow naming convention by yourself 



##### 2.3.2 example-deployment.yaml

```yaml
{{- if not .Values.common.majorRelease }}
apiVersion: apps/v1  
kind: Deployment  
metadata:  
  name: {{ include "application.fullDashName" . }}  
  labels: {{- include "application.labels" . | nindent 4 }}  
  {{- include "component.monitoring.label" . | nindent 4 }} 
...
{{- end }}
```



##### 2.3.3 example-vs.yaml

```yaml
{{- if .Values.common.majorRelease }}
apiVersion: apps/v1  
kind: VirtualService
metadata:  
  name: {{ include "application.serviceName" . }}-vs
spec:
  hosts:
  - {{ include "application.serviceName" . }}.{{ .Release.Namespace}}.svc.cluster.local
...
{{- end}}
```



##### 2.3.4 example-dr.yaml

```yaml
{{- if .Values.common.majorRelease }}
apiVersion: apps/v1  
kind: DestinationRule
metadata:  
  name: {{ include "application.serviceName" . }}-dr
spec:
  hosts: {{ include "application.serviceName" . }}.{{ .Release.Namespace}}.svc.cluster.local
...
{{- end}}
```



##### 2.3.5 example-sidecar.yaml

```yaml
apiVersion: networking.istio.io/v1beta1  
kind: Sidecar
metadata:  
  name: {{ include "application.fullDashName" . }}-sc
spec:
...
```



### 2.4 添加配置文件

##### 2.4.1 configmap.yaml

```yaml
## By following naming standard, we can use the template or hardcode      
{{- if not .Values.common.majorRelease }}  
apiVersion: v1      
kind: ConfigMap      
metadata:      
  name: {{ include "common.volume.name" (list . "" )}}-configmap      
 # name: ehrss-helm-chart-demo-svc-4-0-1-configmap    
  labels: {{- include "common.application.labels" . | nindent 4 }}      
 data:      
   key: value      
 {{- end }}  
 
---
## name模板的不同用法
{{- if not .Values.common.majorRelease }}  
apiVersion: v1      
kind: ConfigMap      
metadata:      
  name: {{ include "common.volume.name" (list . "test" )}}-configmap      
 # name: ehrss-helm-chart-demo-test-svc-4-0-1-configmap    
  labels: {{- include "common.application.labels" . | nindent 4 }}      
 data:      
   key: value      
 {{- end }}  
```



##### 2.4.2 secret.yaml

```yaml
{{- if not .Values.common.majorRelease }}  
apiVersion: v1      
kind: Secret      
metadata:      
  name: {{ include "common.volume.name" (list . "" )}}-secret    
   # name: ehrss-helm-chart-demo-svc-4-0-0-secret      
  labels: {{- include "common.application.labels" . | nindent 4 }}      
data:      
  key: value     
{{- end }}   
```



##### 2.4.3 route.yaml(建议仅在dev测试使用)

```yaml
{{- if eq .Values.common.application.env "dev" -}}
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: {{ include "common.application.serviceName" (list . "" )}}-route
  labels:
    app: {{ include "common.application.serviceName" (list . "" )}}
spec:
  host: {{ include "common.application.serviceName" (list . "" )}}-{{ $.Release.Namespace }}.apps-dev.ehrpaast7a.serverdev.ehr.gov.hk
  to:
    kind: Service
    name: {{ include "common.application.serviceName" (list . "" )}}
    weight: 100
  tls:
    termination: edge
  wildcardPolicy: None
{{- end }}
```

