defmodule LightningWeb.RunLive.RunViewerLive do
  use LightningWeb, {:live_view, container: {:div, []}}

  import Ecto.Query, only: [from: 2]

  @impl true
  def render(assigns) do
    ~H"""
    <LightningWeb.RunLive.Components.run_viewer run={@run} />
    """
  end

  @impl true
  def mount(_params, %{"run_id" => run_id}, socket) do
    run = get_run_with_output(run_id)

    LightningWeb.Endpoint.subscribe("run:#{run.id}")
    {:ok, socket |> assign(run: run), layout: false}
  end

  @doc """
  Reload the run when any update messages arrive.
  """
  @impl true
  def handle_info(
        %Phoenix.Socket.Broadcast{event: "update", payload: _payload},
        socket
      ) do
    {:noreply,
     socket |> assign(run: socket.assigns.run |> Lightning.Repo.reload!())}
  end

  defp get_run_with_output(id) do
    from(r in Lightning.Invocation.Run,
      where: r.id == ^id,
      preload: :output_dataclip
    )
    |> Lightning.Repo.one()
  end
end
