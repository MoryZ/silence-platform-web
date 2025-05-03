<template>
  <div class="settings-security">
    <a-card :bordered="false" title="安全设置">
      <a-form
        :model="formState"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 14 }"
        layout="horizontal"
        @finish="onFinish"
      >
        <a-form-item
          label="密码策略"
          name="passwordPolicy"
        >
          <a-checkbox-group v-model:value="formState.passwordPolicy">
            <a-checkbox value="uppercase">必须包含大写字母</a-checkbox>
            <a-checkbox value="lowercase">必须包含小写字母</a-checkbox>
            <a-checkbox value="numbers">必须包含数字</a-checkbox>
            <a-checkbox value="special">必须包含特殊字符</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <a-form-item
          label="最小密码长度"
          name="minPasswordLength"
          :rules="[{ required: true, message: '请输入最小密码长度' }]"
        >
          <a-input-number
            v-model:value="formState.minPasswordLength"
            :min="6"
            :max="20"
            style="width: 120px"
          />
        </a-form-item>

        <a-form-item
          label="密码有效期"
          name="passwordExpireDays"
          :rules="[{ required: true, message: '请输入密码有效期' }]"
        >
          <a-input-number
            v-model:value="formState.passwordExpireDays"
            :min="0"
            :max="365"
            style="width: 120px"
          />
          <span class="unit">天</span>
        </a-form-item>

        <a-form-item
          label="登录失败限制"
          name="loginFailLimit"
          :rules="[{ required: true, message: '请输入登录失败限制次数' }]"
        >
          <a-input-number
            v-model:value="formState.loginFailLimit"
            :min="0"
            :max="10"
            style="width: 120px"
          />
          <span class="unit">次</span>
        </a-form-item>

        <a-form-item
          label="锁定时间"
          name="lockTime"
          :rules="[{ required: true, message: '请输入账号锁定时间' }]"
        >
          <a-input-number
            v-model:value="formState.lockTime"
            :min="0"
            :max="1440"
            style="width: 120px"
          />
          <span class="unit">分钟</span>
        </a-form-item>

        <a-form-item
          label="会话超时"
          name="sessionTimeout"
          :rules="[{ required: true, message: '请输入会话超时时间' }]"
        >
          <a-input-number
            v-model:value="formState.sessionTimeout"
            :min="5"
            :max="120"
            style="width: 120px"
          />
          <span class="unit">分钟</span>
        </a-form-item>

        <a-form-item
          label="双因素认证"
          name="twoFactorAuth"
        >
          <a-switch v-model:checked="formState.twoFactorAuth" />
        </a-form-item>

        <a-form-item
          label="登录日志"
          name="loginLog"
        >
          <a-switch v-model:checked="formState.loginLog" />
        </a-form-item>

        <a-form-item
          label="操作日志"
          name="operationLog"
        >
          <a-switch v-model:checked="formState.operationLog" />
        </a-form-item>

        <a-form-item
          label="IP白名单"
          name="ipWhitelist"
        >
          <a-select
            v-model:value="formState.ipWhitelist"
            mode="tags"
            style="width: 100%"
            placeholder="请输入IP地址，按回车添加"
          />
        </a-form-item>

        <a-form-item
          label="敏感操作"
          name="sensitiveOperations"
        >
          <a-checkbox-group v-model:value="formState.sensitiveOperations">
            <a-checkbox value="password">修改密码</a-checkbox>
            <a-checkbox value="profile">修改个人信息</a-checkbox>
            <a-checkbox value="settings">修改系统设置</a-checkbox>
            <a-checkbox value="delete">删除操作</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 4, span: 14 }">
          <a-button type="primary" html-type="submit">保存</a-button>
          <a-button style="margin-left: 10px" @click="onReset">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { message } from 'ant-design-vue';

interface FormState {
  passwordPolicy: string[];
  minPasswordLength: number;
  passwordExpireDays: number;
  loginFailLimit: number;
  lockTime: number;
  sessionTimeout: number;
  twoFactorAuth: boolean;
  loginLog: boolean;
  operationLog: boolean;
  ipWhitelist: string[];
  sensitiveOperations: string[];
}

const formState = reactive<FormState>({
  passwordPolicy: ['uppercase', 'lowercase', 'numbers'],
  minPasswordLength: 8,
  passwordExpireDays: 90,
  loginFailLimit: 5,
  lockTime: 30,
  sessionTimeout: 30,
  twoFactorAuth: false,
  loginLog: true,
  operationLog: true,
  ipWhitelist: [],
  sensitiveOperations: ['password', 'profile', 'settings', 'delete'],
});

const onFinish = (values: FormState) => {
  console.log('Success:', values);
  message.success('保存成功');
};

const onReset = () => {
  formState.passwordPolicy = ['uppercase', 'lowercase', 'numbers'];
  formState.minPasswordLength = 8;
  formState.passwordExpireDays = 90;
  formState.loginFailLimit = 5;
  formState.lockTime = 30;
  formState.sessionTimeout = 30;
  formState.twoFactorAuth = false;
  formState.loginLog = true;
  formState.operationLog = true;
  formState.ipWhitelist = [];
  formState.sensitiveOperations = ['password', 'profile', 'settings', 'delete'];
};
</script>

<style scoped>
.settings-security {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100%;
}

.unit {
  margin-left: 8px;
  color: rgba(0, 0, 0, 0.45);
}
</style> 