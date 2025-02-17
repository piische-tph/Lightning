defmodule LightningWeb.WorkflowLive.Helpers do
  @moduledoc """
  Helper functions for the Workflow LiveViews.
  """

  alias Lightning.Repo

  alias Lightning.Workflows
  alias Lightning.WorkOrders
  alias Lightning.AttemptRun

  @spec save_and_run(
          Ecto.Changeset.t(Workflows.Workflow.t()),
          Ecto.Changeset.t(WorkOrders.Manual.t())
        ) ::
          {:ok, %{attempt_run: AttemptRun.t(), workflow: Workflows.Workflow.t()}}
          | {:error, Ecto.Changeset.t(Workflows.Workflow.t())}
          | {:error, Ecto.Changeset.t(WorkOrders.Manual.t())}
  def save_and_run(workflow_changeset, manual_workorder_changeset) do
    Lightning.Repo.transact(fn ->
      with {:ok, workflow} <- save_workflow(workflow_changeset),
           {:ok, %{attempt_run: attempt_run}} <-
             create_user_workorder(manual_workorder_changeset) do
        {:ok, %{attempt_run: attempt_run, workflow: workflow}}
      end
    end)
  end

  @spec save_workflow(Ecto.Changeset.t(Workflows.Workflow.t())) ::
          {:ok, Workflows.Workflow.t()}
          | {:error, Ecto.Changeset.t(Workflows.Workflow.t())}
  def save_workflow(changeset) do
    Repo.insert_or_update(changeset)
  end

  @spec create_user_workorder(Ecto.Changeset.t(WorkOrders.Manual.t())) ::
          {:ok, %{attempt_run: AttemptRun.t()}}
          | {:error, Ecto.Changeset.t(WorkOrders.Manual.t())}
  def create_user_workorder(changeset) do
    Repo.transact(fn ->
      with {:ok, user_workorder} <-
             Ecto.Changeset.apply_action(changeset, :validate),
           {:ok, dataclip} <- find_or_create_dataclip(user_workorder) do
        # HACK: Oban's testing functions only apply to `self` and LiveView
        # tests run in child processes, so for now we need to set the testing
        # mode from within the process.
        Process.put(:oban_testing, :manual)

        Lightning.WorkOrderService.create_manual_workorder(
          user_workorder.job,
          dataclip,
          user_workorder.user
        )
      else
        {:error, :not_found} ->
          {:error,
           changeset |> Ecto.Changeset.add_error(:dataclip_id, "not found")}

        {:error, changeset} ->
          {:error, changeset}
      end
    end)
  end

  defp find_or_create_dataclip(%{dataclip_id: dataclip_id, body: nil}) do
    Lightning.Invocation.get_dataclip(dataclip_id)
    |> case do
      nil ->
        {:error, :not_found}

      d ->
        {:ok, d}
    end
  end

  defp find_or_create_dataclip(%{dataclip_id: nil, body: body, project: project}) do
    body =
      body
      |> Jason.decode()
      |> case do
        {:ok, body} ->
          body

        {:error, _} ->
          body
      end

    Lightning.Invocation.create_dataclip(%{
      project_id: project.id,
      type: :run_result,
      body: body
    })
  end
end
