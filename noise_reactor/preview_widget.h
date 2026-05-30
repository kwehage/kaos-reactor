#pragma once

#include "noise_reactor/audio_frame_data.h"
#include "noise_reactor/effect_params.h"

#include <QImage>
#include <QRhiWidget>

class QRhiBuffer;
class QRhiGraphicsPipeline;
class QRhiSampler;
class QRhiShaderResourceBindings;

namespace noise_reactor {

class PreviewWidget : public QRhiWidget {
    Q_OBJECT
public:
    explicit PreviewWidget(QWidget* parent = nullptr);

    void set_image(const QImage& image);
    void set_frame_data(const FrameData& frame, const EffectParams& params);

protected:
    void initialize(QRhiCommandBuffer* cb) override;
    void render(QRhiCommandBuffer* cb) override;
    void releaseResources() override;

private:
    void cleanup();
    void rebuild_bindings();
    void rebuild_pipeline();

    QRhi*                       rhi_{nullptr};
    QRhiTexture*                texture_{nullptr};
    QRhiSampler*                sampler_{nullptr};
    QRhiBuffer*                 uniform_buffer_{nullptr};
    QRhiShaderResourceBindings* bindings_{nullptr};
    QRhiGraphicsPipeline*       pipeline_{nullptr};

    QImage    pending_image_{};
    bool      image_dirty_{false};
    EffectUBO ubo_data_{};
    float     time_{0.f};
};

} // namespace noise_reactor
