#pragma once

#include "noise_reactor/audio_analysis.h"
#include "noise_reactor/effect_params.h"

#include <QFutureWatcher>
#include <QMainWindow>
#include <QString>

QT_FORWARD_DECLARE_CLASS(QAudioOutput)
QT_FORWARD_DECLARE_CLASS(QLabel)
QT_FORWARD_DECLARE_CLASS(QMediaPlayer)
QT_FORWARD_DECLARE_CLASS(QSlider)
QT_FORWARD_DECLARE_CLASS(QPushButton)

namespace noise_reactor {

class PreviewWidget;

class App : public QMainWindow {
    Q_OBJECT

public:
    explicit App(QWidget* parent = nullptr);

    void load_image(const QString& path);
    void load_audio(const QString& path);

private slots:
    void open_audio();
    void open_image();
    void export_video();
    void on_analysis_done();
    void toggle_playback();

private:
    void build_menu();
    void build_layout();
    void update_time_label(int ms);

    PreviewWidget* preview_widget_{nullptr};

    QMediaPlayer* media_player_{nullptr};
    QAudioOutput* audio_output_{nullptr};

    QSlider*     scrubber_{nullptr};
    QLabel*      time_label_{nullptr};
    QPushButton* play_button_{nullptr};

    QFutureWatcher<AudioAnalysis>* analysis_watcher_{nullptr};
    AudioAnalysis analysis_;
    QString       audio_path_;
    EffectParams  effect_params_;
};

} // namespace noise_reactor
