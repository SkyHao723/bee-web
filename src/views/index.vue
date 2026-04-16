<template>
  <div class="app-container home">
    <!-- 轮播图区域 -->
    <el-card class="carousel-card" shadow="hover">
      <el-carousel :interval="5000" arrow="always" height="300px">
        <el-carousel-item v-for="(item, index) in carouselList" :key="index">
          <div class="carousel-content" :style="{ backgroundImage: `url(${item.image})` }">
            <div class="carousel-overlay"></div>
            <div v-if="item.showText" class="carousel-text">
              <h2>{{ item.title }}</h2>
              <p v-if="item.description">{{ item.description }}</p>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </el-card>

    <!-- 项目简介 -->
    <el-card class="intro-card" shadow="hover">
      <div class="intro-header">
        <svg-icon icon-class="guide" class-name="intro-icon" />
        <h2>项目简介</h2>
      </div>
      <div class="intro-content">
        <p class="intro-text">
          蜂箱智联是一款专业的智慧蜂箱管理系统，致力于为现代养蜂业提供数字化、智能化的解决方案。
          系统集成了蜂场管理、蜂箱监控、蜂农协作、设备管理等核心功能，通过物联网技术实时监测蜂箱环境数据，
          帮助蜂农科学管理蜂群，提高养蜂效率，保障蜂产品质量。
        </p>
      </div>
    </el-card>
  </div>
</template>

<script setup name="Index">
import { ref } from 'vue'

const version = ref('3.9.2')

// 导入轮播图图片
import carouselImg1 from '@/assets/images/1803e2eb132f4ca7d7744aae3e0b9be8.jpg'
import carouselImg2 from '@/assets/images/2160e4b3984c074b14b78d87c62cfa9c.jpg'
import carouselImg3 from '@/assets/images/3dff0769d60b6b13d1b7e2ff4fde790b.jpg'
import carouselImg4 from '@/assets/images/44cd3ccc7b279f2f05815dd2b1837ee7.jpg'

// 轮播图数据
const carouselList = ref([
  {
    title: '',
    description: '',
    image: carouselImg1,
    showText: false  // 第一张不显示文字
  },
  {
    title: '智蜂卫士蜂箱制作模型',
    description: '',
    image: carouselImg2,
    showText: true
  },
  {
    title: '实地调研',
    description: '',
    image: carouselImg3,
    showText: true
  },
  {
    title: '传统蜂箱展示',
    description: '',
    image: carouselImg4,
    showText: true
  }
])

function goTarget(url) {
  window.open(url, '__blank')
}
</script>

<style scoped lang="scss">
.home {
  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #eee;
  }
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
  }
  .col-item {
    margin-bottom: 20px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;

  p {
    font-size: 12px;
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0;
      margin-inline-end: 0;
      padding-inline-start: 40px;
    }
  }

  // 轮播图卡片
  .carousel-card {
    margin-bottom: 20px;
    border-radius: 8px;

    :deep(.el-carousel__container) {
      border-radius: 8px;
      overflow: hidden;
    }

    .carousel-content {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 40px;
      box-sizing: border-box;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;

      // 遮罩层 - 提升文字可读性
      .carousel-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 50%);
        z-index: 1;
      }

      .carousel-text {
        position: relative;
        z-index: 2;
        text-align: center;
        color: white;
        padding-bottom: 20px;

        h2 {
          font-size: 32px;
          margin-bottom: 8px;
          font-weight: 600;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        p {
          font-size: 16px;
          opacity: 0.95;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
          margin: 0;
        }
      }
    }
  }

  // 项目简介卡片
  .intro-card {
    margin-bottom: 20px;
    border-radius: 8px;

    .intro-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;

      .intro-icon {
        font-size: 28px;
        color: var(--el-color-primary);
        margin-right: 12px;
      }

      h2 {
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0;
      }
    }

    .intro-content {
      .intro-text {
        font-size: 15px;
        line-height: 1.8;
        color: var(--el-text-color-regular);
        text-indent: 2em;
      }
    }
  }

  // 移动端适配
  @media (max-width: 768px) {
    .carousel-card {
      .carousel-content {
        padding: 20px;

        .carousel-text {
          h2 {
            font-size: 24px;
          }

          p {
            font-size: 14px;
          }
        }
      }
    }

    .intro-card {
      .intro-header {
        .intro-icon {
          font-size: 24px;
        }

        h2 {
          font-size: 20px;
        }
      }

      .intro-content {
        .intro-text {
          font-size: 14px;
          text-indent: 2em;
        }
      }
    }
  }
}
</style>