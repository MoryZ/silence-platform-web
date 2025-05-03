<template>
  <div class="settings-general">
    <a-card :bordered="false" title="通用设置">
      <a-form
        :model="formState"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 14 }"
        layout="horizontal"
        @finish="onFinish"
      >
        <a-form-item
          label="系统名称"
          name="systemName"
          :rules="[{ required: true, message: '请输入系统名称' }]"
        >
          <a-input v-model:value="formState.systemName" placeholder="请输入系统名称" />
        </a-form-item>

        <a-form-item
          label="系统Logo"
          name="systemLogo"
        >
          <a-upload
            v-model:file-list="fileList"
            name="logo"
            list-type="picture-card"
            class="logo-uploader"
            :show-upload-list="false"
            :before-upload="beforeUpload"
          >
            <img v-if="formState.systemLogo" :src="formState.systemLogo" alt="logo" />
            <div v-else>
              <plus-outlined />
              <div class="ant-upload-text">上传</div>
            </div>
          </a-upload>
        </a-form-item>

        <a-form-item
          label="系统描述"
          name="systemDescription"
        >
          <a-textarea
            v-model:value="formState.systemDescription"
            :rows="4"
            placeholder="请输入系统描述"
          />
        </a-form-item>

        <a-form-item
          label="时区"
          name="timezone"
          :rules="[{ required: true, message: '请选择时区' }]"
        >
          <a-select v-model:value="formState.timezone" placeholder="请选择时区">
            <a-select-option value="Asia/Shanghai">中国标准时间 (UTC+8)</a-select-option>
            <a-select-option value="UTC">世界标准时间 (UTC)</a-select-option>
            <a-select-option value="America/New_York">美国东部时间 (UTC-5)</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="语言"
          name="language"
          :rules="[{ required: true, message: '请选择语言' }]"
        >
          <a-select v-model:value="formState.language" placeholder="请选择语言">
            <a-select-option value="zh_CN">简体中文</a-select-option>
            <a-select-option value="en_US">English</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="主题"
          name="theme"
          :rules="[{ required: true, message: '请选择主题' }]"
        >
          <a-select v-model:value="formState.theme" placeholder="请选择主题">
            <a-select-option value="light">浅色</a-select-option>
            <a-select-option value="dark">深色</a-select-option>
            <a-select-option value="system">跟随系统</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="导航模式"
          name="navMode"
          :rules="[{ required: true, message: '请选择导航模式' }]"
        >
          <a-select v-model:value="formState.navMode" placeholder="请选择导航模式">
            <a-select-option value="side">侧边菜单</a-select-option>
            <a-select-option value="top">顶部菜单</a-select-option>
            <a-select-option value="mix">混合菜单</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="固定头部"
          name="fixedHeader"
        >
          <a-switch v-model:checked="formState.fixedHeader" />
        </a-form-item>

        <a-form-item
          label="固定侧边栏"
          name="fixedSidebar"
        >
          <a-switch v-model:checked="formState.fixedSidebar" />
        </a-form-item>

        <a-form-item
          label="显示标签页"
          name="showTabs"
        >
          <a-switch v-model:checked="formState.showTabs" />
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
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import type { UploadProps } from 'ant-design-vue';

interface FormState {
  systemName: string;
  systemLogo: string;
  systemDescription: string;
  timezone: string;
  language: string;
  theme: string;
  navMode: string;
  fixedHeader: boolean;
  fixedSidebar: boolean;
  showTabs: boolean;
}

const formState = reactive<FormState>({
  systemName: 'Silence Platform',
  systemLogo: '',
  systemDescription: 'Silence配置管理系统',
  timezone: 'Asia/Shanghai',
  language: 'zh_CN',
  theme: 'light',
  navMode: 'side',
  fixedHeader: true,
  fixedSidebar: true,
  showTabs: true,
});

const fileList = ref([]);

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB！');
    return false;
  }
  // TODO: 实现文件上传逻辑
  return false;
};

const onFinish = (values: FormState) => {
  console.log('Success:', values);
  message.success('保存成功');
};

const onReset = () => {
  formState.systemName = 'Silence Platform';
  formState.systemLogo = '';
  formState.systemDescription = 'Silence配置管理系统';
  formState.timezone = 'Asia/Shanghai';
  formState.language = 'zh_CN';
  formState.theme = 'light';
  formState.navMode = 'side';
  formState.fixedHeader = true;
  formState.fixedSidebar = true;
  formState.showTabs = true;
};
</script>

<style scoped>
.settings-general {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100%;
}

.logo-uploader {
  text-align: center;
}

.logo-uploader img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style> 