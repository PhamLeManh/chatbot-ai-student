/**
 * ==========================================================================
 * AI STUDENT ASSISTANT - STUDY PLANNER JS (studyPlan.js)
 * AI Schedule Generator, Interactive Checklist, Progress Calculation & Countdown
 * ==========================================================================
 */

let activePlan = null;

document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }

  initStudyPlanEvents();
  await loadStudyPlans();
});

function initStudyPlanEvents() {
  const planForm = document.getElementById('create-plan-form');
  if (planForm) {
    planForm.addEventListener('submit', handleCreatePlan);
  }

  // Gợi ý ngày tối thiểu là ngày mai
  const targetDateInput = document.getElementById('targetDate');
  if (targetDateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    targetDateInput.min = tomorrow.toISOString().split('T')[0];
    
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    targetDateInput.value = defaultDate.toISOString().split('T')[0];
  }
}

async function loadStudyPlans() {
  const container = document.getElementById('study-plans-list');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: var(--text-dim);">
      <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--primary);"></i>
      <p style="margin-top: 0.5rem;">Đang tải danh sách lộ trình học...</p>
    </div>
  `;

  try {
    const result = await fetchAPI('/api/study-plans');
    const plans = result.data || [];

    if (plans.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
          <div style="width: 60px; height: 60px; border-radius: var(--radius-md); background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1rem;">
            <i class="fas fa-calendar-plus"></i>
          </div>
          <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem;">Chưa có Lộ trình học nào</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 450px; margin: 0 auto 1.5rem;">
            Hãy để Trí tuệ nhân tạo (AI) giúp bạn lập một kế hoạch ôn thi khoa học, chi tiết từng ngày để đạt điểm số cao nhất!
          </p>
          <button class="btn btn-primary" onclick="openCreatePlanModal()">
            <i class="fas fa-magic"></i> Tạo Lộ Trình Ôn Thi Bằng AI
          </button>
        </div>
      `;
      document.getElementById('active-plan-detail').innerHTML = '';
      return;
    }

    renderPlansSelector(plans);
    if (!activePlan || !plans.find((p) => p._id === activePlan._id)) {
      renderPlanDetail(plans[0]);
    } else {
      const refreshedActive = plans.find((p) => p._id === activePlan._id);
      renderPlanDetail(refreshedActive);
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderPlansSelector(plans) {
  const container = document.getElementById('study-plans-list');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
      ${plans
        .map(
          (plan) => `
        <button class="btn ${activePlan && activePlan._id === plan._id ? 'btn-primary' : 'btn-secondary'} btn-sm" 
                onclick="selectPlan('${plan._id}')" 
                style="white-space: nowrap;">
          <i class="fas fa-book-open"></i> ${escapeHtml(plan.title)}
          <span class="badge ${plan.progressPercentage === 100 ? 'badge-success' : 'badge-primary'}" style="margin-left: 4px;">
            ${plan.progressPercentage}%
          </span>
        </button>
      `
        )
        .join('')}
      <button class="btn btn-secondary btn-sm" onclick="openCreatePlanModal()" style="white-space: nowrap; border-style: dashed;">
        <i class="fas fa-plus"></i> Tạo kế hoạch mới
      </button>
    </div>
  `;
}

async function selectPlan(planId) {
  try {
    const result = await fetchAPI(`/api/study-plans/${planId}`);
    renderPlanDetail(result.data);
    loadStudyPlans(); // Refresh selector buttons
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderPlanDetail(plan) {
  activePlan = plan;
  const container = document.getElementById('active-plan-detail');
  if (!container) return;

  const targetDate = new Date(plan.targetDate);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));

  let scheduleHtml = '';
  if (plan.schedule && plan.schedule.length > 0) {
    scheduleHtml = plan.schedule
      .map(
        (day) => `
      <div class="card" style="margin-bottom: 1.25rem; background: var(--bg-surface);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
          <div>
            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary);">${escapeHtml(day.dayName)}</h4>
            <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fas fa-bullseye"></i> Trọng tâm: ${escapeHtml(day.focus)}</span>
          </div>
          ${day.date ? `<span class="badge badge-primary">${day.date}</span>` : ''}
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
          ${day.tasks
            .map(
              (task) => `
            <div style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); background: var(--bg-glass); border: 1px solid var(--border-color); transition: all 0.2s ease;">
              <input type="checkbox" 
                     id="task-${task._id}" 
                     ${task.isCompleted ? 'checked' : ''} 
                     onchange="toggleTaskStatus('${plan._id}', '${task._id}')" 
                     style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer; accent-color: var(--primary);">
              <div style="flex: 1;">
                <label for="task-${task._id}" style="font-size: 0.95rem; font-weight: 600; cursor: pointer; text-decoration: ${task.isCompleted ? 'line-through' : 'none'}; color: ${task.isCompleted ? 'var(--text-dim)' : 'var(--text-main)'};">
                  ${escapeHtml(task.title)}
                </label>
                <div style="display: flex; gap: 0.75rem; font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                  <span><i class="fas fa-clock"></i> ${task.duration}</span>
                  <span><i class="fas fa-tag"></i> ${task.subject}</span>
                  ${task.notes ? `<span><i class="fas fa-info-circle"></i> ${escapeHtml(task.notes)}</span>` : ''}
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
      )
      .join('');
  }

  let tipsHtml = '';
  if (plan.studyTips && plan.studyTips.length > 0) {
    tipsHtml = `
      <div class="card" style="margin-top: 1.5rem; background: rgba(99, 102, 241, 0.08); border-color: var(--primary-light);">
        <h4 style="font-size: 1rem; font-weight: 700; color: var(--primary); margin-bottom: 0.75rem;">
          <i class="fas fa-lightbulb"></i> Lời khuyên từ Cố vấn AI:
        </h4>
        <ul style="margin-left: 1.25rem; font-size: 0.9rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.4rem;">
          ${plan.studyTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = `
    <!-- Plan Header Card -->
    <div class="card" style="margin-bottom: 1.5rem; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <span class="badge badge-primary" style="margin-bottom: 0.5rem;"><i class="fas fa-robot"></i> Kế hoạch sinh bởi AI</span>
          <h2 style="font-size: 1.6rem; font-weight: 800;">${escapeHtml(plan.title)}</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">
            <strong>Mục tiêu:</strong> ${escapeHtml(plan.goal)} &bull; <strong>Kỳ thi:</strong> ${escapeHtml(plan.targetExam)}
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="deletePlan('${plan._id}')" title="Xóa lộ trình">
            <i class="fas fa-trash-alt"></i> Xóa
          </button>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin: 1.25rem 0;">
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Thời gian còn lại</span>
          <div style="font-size: 1.6rem; font-weight: 800; color: ${daysLeft <= 3 ? 'var(--accent)' : 'var(--primary)'};">
            ${daysLeft} <span style="font-size: 0.9rem;">ngày</span>
          </div>
        </div>

        <div style="background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Thời lượng học</span>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--secondary);">
            ${plan.dailyHours} <span style="font-size: 0.9rem;">giờ/ngày</span>
          </div>
        </div>

        <div style="background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Tiến độ hoàn thành</span>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--success);">
            ${plan.progressPercentage}%
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">
          <span>Tiến độ nhiệm vụ</span>
          <span>${plan.progressPercentage}%</span>
        </div>
        <div style="width: 100%; height: 8px; background: var(--bg-surface); border-radius: var(--radius-full); overflow: hidden;">
          <div style="height: 100%; width: ${plan.progressPercentage}%; background: linear-gradient(90deg, var(--primary), var(--secondary)); transition: width 0.4s ease;"></div>
        </div>
      </div>
    </div>

    <!-- Schedule Days List -->
    <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">
      <i class="fas fa-calendar-alt" style="color: var(--primary);"></i> Lịch Trình Chi Tiết Từng Ngày:
    </h3>
    ${scheduleHtml}
    ${tipsHtml}
  `;
}

async function toggleTaskStatus(planId, taskId) {
  try {
    const result = await fetchAPI(`/api/study-plans/${planId}/tasks/${taskId}/toggle`, { method: 'PUT' });
    renderPlanDetail(result.data);
    showToast('Đã cập nhật tiến độ học tập!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleCreatePlan(e) {
  e.preventDefault();
  const goal = document.getElementById('goal').value.trim();
  const targetExam = document.getElementById('targetExam').value.trim();
  const targetDate = document.getElementById('targetDate').value;
  const dailyHours = document.getElementById('dailyHours').value;
  const subjectsInput = document.getElementById('subjects').value.trim();
  const subjects = subjectsInput ? subjectsInput.split(',').map((s) => s.trim()) : [];
  const submitBtn = document.getElementById('create-plan-submit-btn');

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI Đang Xây Dựng Lộ Trình...';

    const result = await fetchAPI('/api/study-plans', {
      method: 'POST',
      body: JSON.stringify({ goal, targetExam, targetDate, dailyHours, subjects }),
    });

    closeCreatePlanModal();
    showToast('AI đã lập lộ trình học tập thành công!', 'success');
    await loadStudyPlans();
    renderPlanDetail(result.data);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-magic"></i> Tạo Kế Hoạch Bằng AI';
  }
}

async function deletePlan(planId) {
  if (!confirm('Bạn có chắc muốn xóa lộ trình ôn thi này?')) return;
  try {
    await fetchAPI(`/api/study-plans/${planId}`, { method: 'DELETE' });
    showToast('Đã xóa lộ trình học tập.', 'info');
    activePlan = null;
    loadStudyPlans();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function openCreatePlanModal() {
  const modal = document.getElementById('create-plan-modal');
  if (modal) modal.classList.add('active');
}

function closeCreatePlanModal() {
  const modal = document.getElementById('create-plan-modal');
  if (modal) modal.classList.remove('active');
}
